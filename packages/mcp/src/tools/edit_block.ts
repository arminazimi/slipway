// Replaces one block, named by its ID (the start of its span, ADR 0026), and proves the rebuild
// touched nothing else: the page is rendered before and after, and every byte outside the edited
// element must match. Any difference refuses the edit and writes nothing.
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { unifiedDiff } from "../../../engine/src/cli/edit-apply.ts";
import { loadConfig } from "../../../engine/src/config/load.ts";
import { parseFrontMatter } from "../../../engine/src/content/frontmatter.ts";
import type { SourcePos } from "../../../engine/src/contracts/source.ts";
import { hashSource, spanToOffsets } from "../../../engine/src/edits/patch.ts";
import { parseMarkdown } from "../../../engine/src/markdown/parse.ts";
import { markdownToHtml } from "../../../engine/src/markdown/to-html.ts";
import { blockIdOf, formatSpan, parseSpan } from "../../../engine/src/source/spans.ts";
import { insideSite } from "../tools.ts";

export const definition = {
  name: "edit_block",
  description:
    "Replace one block, named by its block ID, with new Markdown. It refuses a stale hash and writes nothing unless rebuilding the page leaves everything outside the block unchanged. It returns the changed file, the old and new spans, the new hash, and a diff.",
  inputSchema: {
    type: "object",
    properties: {
      block: {
        type: "string",
        description: "The block's ID, the start of its span: path:line:column (e.g. guide/install.md:12:1), as the built page's data-src gives it.",
      },
      markdown: { type: "string", description: "The Markdown that replaces the block's span." },
      hash: {
        type: "string",
        description: "The SHA-256 of the page file the block was read from, hex. A different hash is refused as a stale read.",
      },
    },
    required: ["block", "markdown", "hash"],
    additionalProperties: false,
  },
};

/** A place in a page's HTML: the offsets of a whole element, opening tag through closing tag. */
interface Bounds {
  readonly start: number;
  readonly end: number;
}

/** One block element of a rendered page. */
interface HtmlBlock extends Bounds {
  readonly id: string;
  readonly span: SourcePos;
}

/** Decodes the entities that can appear in a `data-src` value (the same set `spans.ts` decodes). */
function decodeAttr(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** The offset just after the tag that starts at `start`, or -1 when it never closes. Quotes are honored. */
function tagEnd(html: string, start: number): number {
  let quote: string | undefined;
  for (let index = start + 1; index < html.length; index += 1) {
    const character = html[index];
    if (quote !== undefined) {
      if (character === quote) quote = undefined;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return index + 1;
    }
  }
  return -1;
}

/** The end of the element whose opening tag ends at `openEnd`, by matching same-name tags. */
function closeOf(html: string, openStart: number, openEnd: number, openTag: string): number | undefined {
  const name = /^<([a-zA-Z][^\s/>]*)/.exec(openTag)?.[1];
  if (name === undefined) return undefined;
  if (openTag.trimEnd().endsWith("/>")) return openEnd;

  let depth = 1;
  let index = openEnd;
  while (index < html.length) {
    const start = html.indexOf("<", index);
    if (start < 0) return undefined;
    if (html.startsWith("<!--", start)) {
      const close = html.indexOf("-->", start + 4);
      if (close < 0) return undefined;
      index = close + 3;
      continue;
    }
    const end = tagEnd(html, start);
    if (end < 0) return undefined;
    const tag = html.slice(start, end);
    const found = /^<\/?([a-zA-Z][^\s/>]*)/.exec(tag)?.[1];
    if (found !== undefined && found.toLowerCase() === name.toLowerCase()) {
      if (tag.startsWith("</")) {
        depth -= 1;
        if (depth === 0) return end;
      } else if (!tag.trimEnd().endsWith("/>")) {
        depth += 1;
      }
    }
    index = end;
  }
  return undefined;
}

/** Every block element of a page's HTML, in document order, with its span and its place in the HTML. */
function blocksIn(html: string): HtmlBlock[] {
  const blocks: HtmlBlock[] = [];
  let index = 0;
  while (index < html.length) {
    const start = html.indexOf("<", index);
    if (start < 0) break;
    if (html.startsWith("<!--", start)) {
      const close = html.indexOf("-->", start + 4);
      if (close < 0) break;
      index = close + 3;
      continue;
    }
    const end = tagEnd(html, start);
    if (end < 0) break;
    const tag = html.slice(start, end);
    const closing = tag.startsWith("</");
    if (!closing) {
      const source = /\bdata-src="([^"]*)"/.exec(tag)?.[1];
      const span = source === undefined ? undefined : parseSpan(decodeAttr(source));
      const elementEnd = span === undefined ? undefined : closeOf(html, start, end, tag);
      if (span !== undefined && elementEnd !== undefined) {
        blocks.push({ id: blockIdOf(span), span, start, end: elementEnd });
      }
    }
    index = end;
  }
  return blocks;
}

/** A page's body HTML, rendered the way the engine renders it: front matter split off, Markdown parsed with positions. */
async function pageHtml(source: string, file: string): Promise<string> {
  const frontMatter = parseFrontMatter(source, file);
  const tree = await parseMarkdown(frontMatter.body, frontMatter.bodyLine);
  return (await markdownToHtml(tree, file)).html;
}

/**
 * The path a block ID names, relative to the site. A span's file is relative to the repository root, so the
 * config's `repository.dir` is taken off first when the site is one folder in a repository.
 */
function sitePathOf(site: string, file: string): string {
  const folder = (loadConfig(site).config.repository?.dir ?? "")
    .replace(/\\/g, "/")
    .replace(/^(\.\/)+/, "")
    .replace(/^\/+|\/+$/g, "");
  if (folder === "") return file;
  return file.startsWith(`${folder}/`) ? file.slice(folder.length + 1) : file;
}

/** A page's HTML with its `data-src` values gone: the spans of later blocks shift, their content does not. */
function withoutSpans(html: string): string {
  return html.replace(/\sdata-src="[^"]*"/g, "");
}

/** The part of a page outside one block's element, with the block spans removed. */
function outside(html: string, block: HtmlBlock): string {
  return withoutSpans(html.slice(0, block.start) + html.slice(block.end));
}

/** True when `span` starts at or after `line` and `column`, the place the replacement begins. */
function atOrAfter(span: SourcePos, line: number, column: number): boolean {
  return span.line > line || (span.line === line && span.column >= column);
}

/**
 * Replaces the block whose ID is `block` with `markdown`, then rebuilds its page and refuses the edit when anything
 * outside the block changed. The source hash the caller read must still match, so an edit is never applied to a page
 * that moved under it. Nothing is written unless the proof passes.
 */
export async function editBlock(siteDir: string, args: any = {}) {
  const { block, markdown, hash } = args;

  if (typeof block !== "string" || block === "") {
    throw new Error("edit_block needs a block ID, such as guide/install.md:12:1");
  }
  if (typeof markdown !== "string") throw new Error("markdown must be a string");
  if (typeof hash !== "string" || hash === "") {
    throw new Error("edit_block needs the SHA-256 of the page it read, in hash");
  }

  const point = parseSpan(block);
  if (point === undefined) {
    throw new Error(`"${block}" is not a block ID; a block ID is path:line:column, such as guide/install.md:12:1`);
  }
  const id = blockIdOf(point);

  const site = realpathSync(siteDir);
  const path = sitePathOf(site, point.file);
  if (!/\.(?:md|markdown)$/i.test(path)) throw new Error(`${point.file} is not a Markdown page`);
  const absolute = insideSite(site, path);
  const source = readFileSync(absolute, "utf8");

  const beforeHash = hashSource(source);
  if (beforeHash !== hash.trim().toLowerCase()) {
    throw new Error(
      `${path} hashes to ${beforeHash}, not ${hash}: the page changed since it was read, so nothing was written. Read the page again and retry with its new hash.`,
    );
  }

  const beforeHtml = await pageHtml(source, point.file);
  const old = blocksIn(beforeHtml).find((entry) => entry.id === id);
  if (old === undefined) {
    throw new Error(`no block at ${id} in ${path}; use the page's current data-src spans for its block IDs`);
  }

  const { start, end } = spanToOffsets(source, old.span);
  const after = source.slice(0, start) + markdown + source.slice(end);

  const afterHtml = await pageHtml(after, point.file);
  const rebuilt = blocksIn(afterHtml);
  const edited = rebuilt.find((entry) => atOrAfter(entry.span, old.span.line, old.span.column));
  if (edited === undefined) {
    throw new Error(
      `the new Markdown leaves no block at ${id} in ${path}; this tool edits one block and does not delete it, so nothing was written`,
    );
  }

  if (outside(beforeHtml, old) !== outside(afterHtml, edited)) {
    throw new Error(
      `edit_block refused: rebuilding ${path} changed content outside the block at ${id}, so nothing was written. Edit one block at a time.`,
    );
  }

  writeFileSync(absolute, after, "utf8");
  return {
    file: path,
    block: blockIdOf(edited.span),
    oldSpan: formatSpan(old.span),
    newSpan: formatSpan(edited.span),
    hash: hashSource(after),
    diff: unifiedDiff(source, after, path),
  };
}

export const handler = (site, args) => editBlock(site, args);
