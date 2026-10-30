import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, resolve, sep } from "node:path";
import { parseDocument } from "yaml";
import { insideSite, outside } from "../tools.mjs";

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

const skipDirs = new Set([".git", ".tmp", "_site", "node_modules", "vendor"]);

// Markdown links and images: the target is the second group, the line is found from the index.
const markdownLink = /(!?\[[^\]]*\]\()([^)\s]+)((?:\s+"[^"]*")?\))/g;

function insidePath(base, path) {
  const target = resolve(base, path);
  if (outside(base, target)) throw new Error(`${path} is outside the site directory`);
  return target;
}

function relativePath(base, path) {
  return relative(base, path).split(sep).join("/");
}

function frontMatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!match) return { data: {}, head: null, body: text };
  return { data: parseDocument(match[1]).toJSON() ?? {}, head: match[1], body: text.slice(match[0].length) };
}

/** The URL Jekyll gives a page: its permalink, or /dir/ for an index and /dir/name.html for the rest. */
function urlOf(site, rel) {
  const { data } = frontMatter(readFileSync(join(site, rel), "utf8"));
  if (typeof data.permalink === "string" && data.permalink) return data.permalink;
  const bare = rel.replace(/\.md$/, "");
  const parts = bare.split("/");
  if (parts[parts.length - 1] === "index") {
    const dir = parts.slice(0, -1).join("/");
    return dir ? `/${dir}/` : "/";
  }
  return `/${bare}.html`;
}

function withoutFragment(url) {
  return url.replace(/[?#].*$/, "");
}

function normalizeUrl(url) {
  return withoutFragment(url).replace(/\/index\.html$/, "/");
}

function isExternal(target) {
  return /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/.test(target);
}

function walk(dir, base, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".nojekyll") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) walk(path, base, files);
    } else if (entry.name.endsWith(".md")) {
      files.push(relativePath(base, path));
    }
  }
  return files;
}

function lineAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

/** A new relative target from one page's URL to another URL, keeping the shape the link already had. */
function relativeTo(fromUrl, toUrl) {
  const fromDir = posix.dirname(fromUrl);
  if (toUrl.endsWith("/")) return posix.relative(fromDir, toUrl) || ".";
  return posix.relative(fromDir, toUrl);
}

function setRedirect(data, oldUrl) {
  const current = data.redirect_from;
  const list = current == null ? [] : Array.isArray(current) ? current.filter((item) => typeof item === "string") : [String(current)];
  if (!list.includes(oldUrl)) list.push(oldUrl);
  return list;
}

function rewriteLinks(site, file, oldFile, newFile, oldUrl, newUrl, changed) {
  const path = join(site, file);
  const text = readFileSync(path, "utf8");
  const fileUrl = urlOf(site, file);
  let result = "";
  let last = 0;
  let touched = false;
  for (const match of text.matchAll(markdownLink)) {
    const [whole, start, target, end] = match;
    if (start.startsWith("!")) continue;
    if (isExternal(target) || target.startsWith("#")) continue;
    const fragment = target.slice(withoutFragment(target).length);
    const bare = withoutFragment(target);
    const absolute = bare.startsWith("/");
    const resolved = absolute
      ? normalizeUrl(bare)
      : normalizeUrl(posix.join(posix.dirname(fileUrl), bare));
    const sourceRelative = !absolute && !bare.match(/\.html?$/) ? posix.join(posix.dirname(file), bare) : null;
    if (resolved !== normalizeUrl(oldUrl) && sourceRelative !== oldFile) continue;
    const next = absolute
      ? `${newUrl}${fragment}`
      : bare.endsWith(".md")
        ? `${posix.relative(posix.dirname(file), newFile)}${fragment}`
        : `${relativeTo(fileUrl, newUrl)}${fragment}`;
    const index = match.index + start.length;
    result += text.slice(last, index) + next;
    last = index + target.length;
    touched = true;
    changed.push({ file, line: lineAt(text, match.index) });
  }
  if (!touched) return;
  result += text.slice(last);
  if (result !== text) writeFileSync(path, result);
}

function rewriteNavigation(site, oldUrl, newUrl, changed) {
  const path = join(site, "_data", "navigation.yml");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  const oldForms = new Set([oldUrl, oldUrl.replace(/\/$/, ""), normalizeUrl(oldUrl)]);
  let touched = false;
  const lines = text.split("\n").map((line, index) => {
    const match = /^(\s*(?:- )?url:\s*)(["']?)([^"'\n]*?)\2(\s*)$/.exec(line);
    if (!match) return line;
    const value = match[3].trim();
    if (!oldForms.has(value) && !oldForms.has(value.replace(/\/$/, ""))) return line;
    touched = true;
    changed.push({ file: "_data/navigation.yml", line: index + 1 });
    return `${match[1]}${match[2]}${newUrl}${match[2]}${match[4]}`;
  });
  if (touched) writeFileSync(path, lines.join("\n"));
}

/** Moves a page and keeps everything that pointed at it working. */
export function movePage(site, { from, to }) {
  const base = realpathSync(site);
  if (!from || !to) throw new Error("from and to are required");
  if (!from.endsWith(".md") || !to.endsWith(".md")) throw new Error("move_page moves Markdown pages; from and to must end with .md");
  if (from === to) throw new Error("from and to are the same page");
  const source = insideSite(site, from);
  if (!statSync(source).isFile()) throw new Error(`${from} is not a file`);
  const target = insidePath(base, to);
  if (existsSync(target)) throw new Error(`${to} already exists in the site`);

  const oldUrl = urlOf(site, from);

  mkdirSync(dirname(target), { recursive: true });
  renameSync(source, target);
  const newUrl = urlOf(site, to);
  const moved = oldUrl !== newUrl;
  if (!moved) return { moved: { from, to }, redirect_from: [], changed: [{ file: to }] };

  const text = readFileSync(target, "utf8");
  const { data, head, body } = frontMatter(text);
  const redirectFrom = setRedirect(data, oldUrl);
  const doc = parseDocument(head ?? "");
  doc.set("redirect_from", redirectFrom);
  const nextHead = doc.toString().replace(/\n$/, "");
  const redirectLine = nextHead.split("\n").findIndex((line) => line.startsWith("redirect_from")) + 2;
  writeFileSync(target, `---\n${nextHead}\n---\n${body}`);

  const changed = [{ file: to, line: redirectLine }];
  for (const file of walk(base, base)) {
    if (file === to) continue;
    rewriteLinks(base, file, from, to, oldUrl, newUrl, changed);
  }
  rewriteNavigation(base, oldUrl, newUrl, changed);

  const seen = new Set();
  const unique = changed.filter((entry) => {
    const key = `${entry.file}:${entry.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { moved: { from, to }, redirect_from: [oldUrl], changed: unique };
}

export const handler = (site, args) => movePage(site, args);
