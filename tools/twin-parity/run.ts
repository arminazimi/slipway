// Twin parity gate: every page's Markdown twin says the same text as its HTML page.
//
//   node tools/twin-parity/run.ts    build the fixtures through the shared fixture build and compare every page
//
// A page's Markdown twin (ADR 0006) is the page's text as an agent reads it; its HTML is the same text as a
// person reads it. This gate normalizes both to blocks of words and compares them in order: the HTML comes from
// the `<main>` landmark, keeping only the blocks the Markdown stage stamped with `data-src`, so layout chrome and
// a component's visual label do not count; the twin comes from the same Markdown parser the build uses. It names
// the first page and block that differ, and exits 1.
import { readFile } from "node:fs/promises";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseMarkdown } from "../../packages/engine/src/markdown/parse.ts";
import { builtSite, FIXTURES } from "../fixture-build/build.ts";

/** The manifest the engine writes into a build, as far as this gate reads it. */
interface Manifest {
  readonly pages: readonly ManifestPage[];
}

/** One page of the manifest: its URL and the files its enabled outputs wrote. */
interface ManifestPage {
  readonly url: string;
  readonly outputs: readonly string[];
}

/** One block whose normalized text differs between a twin and its HTML. */
export interface Difference {
  /** The twin's path in the output folder, such as `quickstart/index.md`. */
  readonly page: string;
  /** The block's 1-based position in the page, or the position where one side ends. */
  readonly block: number;
  /** The twin block's normalized words, or `null` when the twin has no such block. */
  readonly twin: string | null;
  /** The HTML block's normalized words, or `null` when the HTML has no such block. */
  readonly html: string | null;
}

/** The outcome of comparing one build: how many pages were paired, and the first difference when there is one. */
export interface Report {
  readonly pages: number;
  readonly difference?: Difference;
}

/** Named entities that appear in built HTML. Numeric entities are decoded by code point. */
const ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
  "#x27": "'",
};

/** Elements that are component wrappers rather than content: a wrapper is unwrapped, so its label is not text. */
const WRAPPER = new Set(["div", "figure", "details", "aside", "section", "article", "main", "nav", "header", "footer", "form", "dialog"]);

/** Markdown nodes whose text is one block. Their children stay inside it, so a list is one block, not one per item. */
const BLOCK = new Set(["heading", "paragraph", "code", "blockquote", "list", "table"]);

/** Elements with no closing tag, so the scanner never waits for one. */
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);

/** One open HTML element while the scanner walks the page. */
interface Frame {
  readonly name: string;
  readonly dataSrc?: string;
  readonly parent?: Frame;
  text: string;
  hasDataChild: boolean;
  record: boolean;
}

/** Decodes the entities built HTML carries, leaving an unknown one as written. */
function decode(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, entity: string) => {
    if (entity.startsWith("#x")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return ENTITIES[entity] ?? whole;
  });
}

/**
 * The comparable form of a block's text: tags dropped, entities decoded, lowercased, and every run of
 * non-letter, non-number characters (punctuation, whitespace, Markdown markers) collapsed to one space. A
 * document-order comparison of these words is what "says the same thing" means here, so `beacon.yml` and
 * `beacon.yml.` compare equal, and a removed or changed word does not.
 */
export function normalize(text: string): string {
  return decode(text.replace(/<[^>]*>/g, " "))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** The inside of the document's `<main>` landmark, or an empty string when the page has none. */
export function mainOf(html: string): string {
  const open = /<main\b[^>]*>/i.exec(html);
  if (!open) return "";
  const start = open.index + open[0].length;
  let depth = 1;
  const tag = /<\/?main\b[^>]*>/gi;
  tag.lastIndex = start;
  for (let match = tag.exec(html); match; match = tag.exec(html)) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) return html.slice(start, match.index);
  }
  return html.slice(start);
}

/**
 * The text blocks of a built page, in document order. Only elements the Markdown stage stamped with `data-src`
 * are text: breadcrumbs, page title, pager, search, and labels a component adds are layout, not the page's text.
 * A component wrapper (a `div`, `figure`, `details`, …) is unwrapped so the blocks it holds are compared instead
 * of its chrome; a content element such as `blockquote`, `ul`, `table`, or `pre` is one block with its children.
 */
export function htmlBlocks(html: string): string[] {
  const blocks: string[] = [];
  const stack: Frame[] = [];
  const inner = mainOf(html);
  let suppress = 0;
  let cursor = 0;
  const tag = /<[^>]*>/g;
  for (let match = tag.exec(inner); match; match = tag.exec(inner)) {
    const between = inner.slice(cursor, match.index);
    cursor = match.index + match[0].length;
    if (between !== "" && stack.length > 0) stack[stack.length - 1]!.text += ` ${between} `;

    const raw = match[0];
    if (raw.startsWith("<!--")) continue;
    if (raw.startsWith("</")) {
      const name = raw.slice(2).replace(/[\s>].*$/, "").toLowerCase();
      while (stack.length > 0) {
        const frame = stack.pop()!;
        if (frame.name !== name) continue;
        if (frame.record) {
          blocks.push(normalize(frame.text));
          suppress -= 1;
        } else if (frame.dataSrc !== undefined && suppress === 0 && !frame.hasDataChild) {
          blocks.push(normalize(frame.text));
        }
        if (frame.parent !== undefined) frame.parent.text += ` ${frame.text} `;
        break;
      }
      continue;
    }

    const name = raw.slice(1).replace(/[\s/>].*$/, "").toLowerCase();
    if (raw.endsWith("/>") || VOID.has(name)) continue;
    const dataSrc = /\bdata-src\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(raw);
    const frame: Frame = {
      name,
      dataSrc: dataSrc?.[1] ?? dataSrc?.[2],
      parent: stack[stack.length - 1],
      text: "",
      hasDataChild: false,
      record: false,
    };
    if (frame.dataSrc !== undefined) {
      for (const parent of stack) parent.hasDataChild = true;
      // A content element owns its text: its own block is recorded and nested `data-src` blocks stay inside it.
      if (suppress === 0 && !WRAPPER.has(name)) {
        frame.record = true;
        suppress += 1;
      }
    }
    stack.push(frame);
  }
  return blocks;
}

/** Concatenates the text a Markdown node renders with: text and code, not markup, images, or block breaks. */
function textOf(node: unknown): string {
  if (typeof node !== "object" || node === null) return "";
  const typed = node as { type?: string; value?: string; children?: unknown[] };
  if (typed.type === "text" || typed.type === "inlineCode" || typed.type === "code") return typed.value ?? "";
  if (typed.type === "image" || typed.type === "imageReference") return "";
  let out = "";
  for (const child of typed.children ?? []) out += ` ${textOf(child)} `;
  return out;
}

/**
 * The text blocks of a Markdown twin, in document order, from the engine's own parser so GFM tables, lists,
 * directives, and code are the same blocks the build gave the HTML. A directive is a wrapper: its children are
 * compared, never its attributes, because attributes are a component's props rather than text.
 */
export async function twinBlocks(markdown: string): Promise<string[]> {
  const tree = (await parseMarkdown(markdown)) as unknown as { children?: unknown[] };
  const blocks: string[] = [];
  const walk = (node: unknown): void => {
    if (typeof node !== "object" || node === null) return;
    const typed = node as { type?: string; children?: unknown[] };
    if (typed.type !== undefined && BLOCK.has(typed.type)) {
      blocks.push(normalize(textOf(typed)));
      return;
    }
    for (const child of typed.children ?? []) walk(child);
  };
  walk(tree);
  return blocks;
}

/**
 * Compares two block lists in order and returns the first block that differs. A block present on one side only
 * counts as a difference at the point one list ends, so a dropped paragraph fails like a changed one.
 */
export function firstDifference(twin: readonly string[], html: readonly string[]): Omit<Difference, "page"> | undefined {
  const count = Math.max(twin.length, html.length);
  for (let index = 0; index < count; index += 1) {
    const [left, right] = [twin[index], html[index]];
    if (left !== right) return { block: index + 1, twin: left ?? null, html: right ?? null };
  }
  return undefined;
}

/** Compares every page the manifest lists and returns the first difference, or the page count when all agree. */
export async function compareSite(out: string): Promise<Report> {
  const manifest = JSON.parse(await readFile(join(out, ".slipway/manifest.json"), "utf8")) as Manifest;
  let pages = 0;
  for (const page of manifest.pages) {
    const twinPath = page.outputs.find((path) => path.endsWith(".md"));
    const htmlPath = page.outputs.find((path) => path.endsWith(".html"));
    if (twinPath === undefined || htmlPath === undefined) continue;
    pages += 1;
    const [markdown, html] = await Promise.all([readFile(join(out, twinPath), "utf8"), readFile(join(out, htmlPath), "utf8")]);
    const difference = firstDifference(await twinBlocks(markdown), htmlBlocks(html));
    if (difference !== undefined) return { pages, difference: { page: twinPath.split(sep).join("/"), ...difference } };
  }
  return { pages };
}

/** Quotes a block for the report, showing a missing side as `(no block)`. */
function show(text: string | null): string {
  return text === null ? "(no block)" : JSON.stringify(text);
}

/** Builds each fixture, compares every twin, and returns 0 when all agree, 1 at the first difference. */
export async function main(): Promise<number> {
  let pages = 0;
  for (const fixture of FIXTURES) {
    const report = await compareSite(await builtSite(fixture));
    pages += report.pages;
    if (report.difference !== undefined) {
      const { page, block, twin, html } = report.difference;
      console.error(`twin-parity: ${fixture}: ${page} block ${block} differs from its HTML.`);
      console.error(`  twin: ${show(twin)}`);
      console.error(`  html: ${show(html)}`);
      return 1;
    }
  }
  console.log(`twin-parity: ok (${pages} pages, every twin has the same text as its HTML)`);
  return 0;
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().then((code) => {
    process.exitCode = code;
  });
}
