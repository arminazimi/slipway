import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, resolve, sep } from "node:path";
import { isMap, isScalar, isSeq, LineCounter, parseDocument, type Node } from "yaml";
import { loadConfig } from "../../../engine/src/config/load.ts";
import {
  comparablePath,
  contentRoot,
  insideSite,
  isExternal,
  lineAt,
  markdownPages,
  outside,
  pagePath,
  siteRelative,
  sourceRelative,
  withoutBase,
  withoutFragment,
  withBase,
} from "../tools.ts";

export const definition = {
  name: "move_page",
  description:
    "Move or rename a Markdown page, keep its old URL working with redirect_from, and update navigation and links that pointed at it.",
  inputSchema: {
    type: "object",
    properties: {
      from: { type: "string", description: "The page's current path in the site, such as docs/guide/write.md." },
      to: { type: "string", description: "The page's new path in the site, such as docs/guide/author.md." },
    },
    required: ["from", "to"],
    additionalProperties: false,
  },
};

/** Markdown links and images: the target is the second group, the line is found from the index. */
const markdownLink = /(!?\[[^\]]*\]\()([^)\s]+)((?:\s+"[^"]*")?\))/g;

function frontMatter(text: string) {
  const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { data: {} as Record<string, unknown>, head: null, body: text };
  const doc = parseDocument(match[1]!);
  return {
    data: (doc.toJS() ?? {}) as Record<string, unknown>,
    head: match[1]!,
    body: text.slice(match[0].length),
  };
}

function insidePath(base: string, path: string): string {
  const target = resolve(base, path);
  if (outside(base, target)) throw new Error(`${path} is outside the site directory`);
  return target;
}

function relativePath(base: string, path: string): string {
  return relative(base, path).split(sep).join("/");
}

/** A new relative target from one page's URL to another URL, keeping the shape the link already had. */
function relativeTo(fromUrl: string, toUrl: string): string {
  const target = posix.relative(posix.dirname(fromUrl), toUrl);
  if (target === "") return toUrl.endsWith("/") ? "./" : ".";
  return toUrl.endsWith("/") ? `${target}/` : target;
}

function setRedirect(data: Record<string, unknown>, oldPath: string): string[] {
  const current = data.redirect_from;
  const list = current == null ? [] : Array.isArray(current) ? current.filter((item) => typeof item === "string") : [String(current)];
  if (!list.includes(oldPath)) list.push(oldPath);
  return list;
}

/** Links in one page that pointed at the moved source file or its old URL. */
function rewriteLinks(
  root: string,
  file: string,
  changedFile: string,
  oldFile: string,
  newFile: string,
  oldPath: string,
  newPath: string,
  siteBase: string,
  changed: Array<{ file: string; line?: number }>,
): void {
  const path = join(root, file);
  const text = readFileSync(path, "utf8");
  const { data } = frontMatter(text);
  const fileUrl = pagePath(file, data);
  const oldComparable = comparablePath(oldPath);
  let result = "";
  let last = 0;
  let touched = false;
  for (const match of text.matchAll(markdownLink)) {
    const [whole, start, target, end] = match;
    if (start!.startsWith("!") || isExternal(target!) || target!.startsWith("#")) continue;
    const bare = withoutFragment(target!);
    if (bare === "") continue;
    const suffix = target!.slice(bare.length);
    const absolute = bare.startsWith("/");
    const markdown = /\.(?:md|markdown)$/i.test(bare);

    let next: string | undefined;
    if (markdown) {
      const sourceFile = absolute
        ? bare.replace(/^\/+/, "")
        : posix.normalize(posix.join(posix.dirname(file), bare));
      if (sourceFile !== oldFile) continue;
      next = absolute ? `/${newFile}` : posix.relative(posix.dirname(file), newFile);
      if (next === "") next = posix.basename(newFile);
    } else {
      const hadBase = siteBase !== "" && (bare === siteBase || bare.startsWith(`${siteBase}/`));
      const resolved = absolute
        ? comparablePath(withoutBase(bare, siteBase))
        : comparablePath(posix.join(posix.dirname(fileUrl), bare));
      if (resolved !== oldComparable) continue;
      next = absolute || hadBase ? (hadBase ? withBase(siteBase, newPath) : newPath) : relativeTo(fileUrl, newPath);
    }

    const replacement = `${next}${suffix}`;
    if (replacement === target) continue;
    const index = match.index + start!.length;
    result += text.slice(last, index) + replacement;
    last = index + target!.length;
    touched = true;
    changed.push({ file: changedFile, line: lineAt(text, match.index) });
  }
  if (!touched) return;
  result += text.slice(last);
  if (result !== text) writeFileSync(path, result);
}

/** A navigation document and the state one rewrite needs. */
interface NavRewrite {
  readonly base: string;
  readonly oldPath: string;
  readonly newPath: string;
  readonly file: string;
  readonly lineCounter: LineCounter;
  readonly changed: Array<{ file: string; line?: number }>;
}

/** Changes every `url` in the navigation tree that named the page, keeping the YAML's quotes and layout. */
function rewriteNavNode(node: Node | null | undefined, ctx: NavRewrite): void {
  if (isMap(node)) {
    for (const pair of node.items) {
      const key = isScalar(pair.key) ? pair.key.value : undefined;
      const value = pair.value as Node | null | undefined;
      if (key === "url" && isScalar(value) && typeof value.value === "string") {
        const current = value.value;
        if (comparablePath(withoutBase(current, ctx.base)) !== comparablePath(ctx.oldPath)) continue;
        const hadBase = ctx.base !== "" && (current === ctx.base || current.startsWith(`${ctx.base}/`));
        value.value = hadBase ? withBase(ctx.base, ctx.newPath) : ctx.newPath;
        const line = value.range === undefined ? 1 : ctx.lineCounter.linePos(value.range[0]).line;
        ctx.changed.push({ file: ctx.file, line });
      } else {
        rewriteNavNode(value, ctx);
      }
    }
  } else if (isSeq(node)) {
    for (const item of node.items) rewriteNavNode(item as Node, ctx);
  }
}

/** Reads the navigation file before the move, so invalid YAML stops the move instead of being rewritten. */
function readNavigation(base: string, file: string): { text: string; document: ReturnType<typeof parseDocument>; lineCounter: LineCounter } | undefined {
  const path = join(base, file);
  if (!existsSync(path)) return undefined;
  const lineCounter = new LineCounter();
  const document = parseDocument(readFileSync(path, "utf8"), { lineCounter });
  if (document.errors.length > 0) {
    throw new Error(`cannot update ${file}: ${document.errors[0]!.message.split("\n")[0]}`);
  }
  return { text: readFileSync(path, "utf8"), document, lineCounter };
}

/** Moves a page and keeps everything that pointed at it working. */
export function movePage(site: string, { from, to }: { from: string; to: string }) {
  const base = insideSite(site, ".");
  if (!from || !to) throw new Error("from and to are required");
  if (!from.endsWith(".md") || !to.endsWith(".md")) throw new Error("move_page moves Markdown pages; from and to must end with .md");
  if (from === to) throw new Error("from and to are the same page");

  const source = insideSite(site, from);
  if (!statSync(source).isFile()) throw new Error(`${from} is not a file`);
  const target = insidePath(base, to);
  if (existsSync(target)) throw new Error(`${to} already exists in the site`);

  const fromRel = relativePath(base, source);
  const toRel = relativePath(base, target);
  const loaded = loadConfig(base);
  const configError = loaded.diagnostics.find((diagnostic) => diagnostic.severity === "error");
  if (configError !== undefined) throw new Error(`mizzen.yml: ${configError.message}`);
  const config = loaded.config;
  const navigation = readNavigation(base, config.navigation);
  const root = contentRoot(base, config.source);
  const fromSource = sourceRelative(fromRel, config.source);
  const toSource = sourceRelative(toRel, config.source);

  const oldData = frontMatter(readFileSync(source, "utf8")).data;
  const oldPath = pagePath(fromSource, oldData);

  mkdirSync(dirname(target), { recursive: true });
  renameSync(source, target);
  const newData = frontMatter(readFileSync(target, "utf8")).data;
  const newPath = pagePath(toSource, newData);
  const moved = oldPath !== newPath;

  const changed: Array<{ file: string; line?: number }> = [{ file: toRel }];
  if (moved) {
    const text = readFileSync(target, "utf8");
    const { head, body } = frontMatter(text);
    const doc = parseDocument(head ?? "");
    doc.set("redirect_from", setRedirect(oldData, oldPath));
    const nextHead = doc.toString().replace(/\n$/, "");
    const redirectLine = nextHead.split("\n").findIndex((line) => /^redirect_from\s*:/.test(line)) + 2;
    writeFileSync(target, `---\n${nextHead}\n---\n${body}`);
    changed[0] = { file: toRel, line: redirectLine };
  }

  for (const file of markdownPages(root)) {
    if (file === toSource) continue;
    rewriteLinks(root, file, siteRelative(file, config.source), fromSource, toSource, oldPath, newPath, config.base, changed);
  }

  if (navigation !== undefined) {
    rewriteNavNode(navigation.document.contents, {
      base: config.base,
      oldPath,
      newPath,
      file: config.navigation.split(sep).join("/"),
      lineCounter: navigation.lineCounter,
      changed,
    });
    const next = navigation.document.toString();
    if (next !== navigation.text) writeFileSync(join(base, config.navigation), next);
  }

  const seen = new Set<string>();
  const entries = changed
    .filter((entry) => {
      const key = `${entry.file}:${entry.line ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (a.file === b.file ? (a.line ?? 0) - (b.line ?? 0) : a.file < b.file ? -1 : 1));
  const files = [...new Set(entries.map((entry) => entry.file))].sort();
  return { moved: { from: fromRel, to: toRel }, redirect_from: moved ? [oldPath] : [], files, changed: entries };
}

export const handler = (site, args) => movePage(site, args);
