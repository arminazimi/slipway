// Slipway's VitePress adapter: a markdown-it plugin that puts data-source="<source>:<line>" on every
// heading, and a buildEnd hook that writes /sourcemap.json and a Markdown twin of every page.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { headingsIn, linksIn, splitFrontMatter, titleOf } from "./markdown.mjs";

const toPosix = (path) => path.split(sep).join("/");
const inside = (path) => path && !path.startsWith("..") && !isAbsolute(path);

/**
 * The content file an environment names, relative to the source folder. VitePress gives markdown-it
 * both the rewritten path (`relativePath`) and the original file (`realPath`); a page moved by
 * `rewrites` still needs its original path, the one an editor opens.
 */
export function sourceOf(env) {
  if (!env?.relativePath) return null;
  const relativePath = toPosix(env.relativePath);
  if (!env.realPath || !env.path) return relativePath;
  const path = toPosix(env.path);
  if (!path.endsWith(relativePath)) return relativePath;
  const source = toPosix(relative(path.slice(0, path.length - relativePath.length), env.realPath));
  return inside(source) ? source : relativePath;
}

/**
 * markdown-it plugin for VitePress's `markdown.config` (`md.use(sourcePlugin)`): adds
 * `data-source="<source>:<line>"` to every heading, with the source path relative to the site
 * folder and the line counted from the top of the file, front matter included. VitePress renders
 * the front matter away, so the plugin adds its line count back.
 */
export function sourcePlugin(md) {
  md.core.ruler.push("slipway_source", (state) => {
    const env = state.env ?? {};
    const source = sourceOf(env);
    if (!source || !inside(source)) return;
    let offset = 0;
    const file = env.realPath || env.path;
    if (file) {
      try {
        offset = splitFrontMatter(readFileSync(file, "utf8")).offset;
      } catch {
        // The page came from an include or a dynamic route with no file to read; use its line as given.
      }
    }
    for (const token of state.tokens) {
      if (token.type === "heading_open" && token.map) {
        token.attrSet("data-source", `${source}:${token.map[0] + 1 + offset}`);
      }
    }
  });
}

/** A source page's URL path: its output file's path, with `index.html` dropped to a trailing slash. */
export function urlOfPage(source, rewritten) {
  const target = toPosix(String(rewritten ?? source).replace(/\.md$/, ".html"));
  const path = `/${target}`;
  if (path === "/index.html") return "/";
  return path.endsWith("/index.html") ? path.slice(0, -"index.html".length) : path;
}

/** The twin's URL path: the page's address with `.md` instead of `.html`, or `index.md` under an address that ends in `/`. */
export const twinUrl = (url) => (url.endsWith("/") ? `${url}index.md` : `${url.replace(/\.html$/, "")}.md`);

/** The twin: the page's Markdown as written, without front matter, under a title heading unless it starts with one. */
export function twinOf(raw, title) {
  const body = splitFrontMatter(raw).body.replace(/^\s*\n/, "");
  return title && !/^#[ \t]/.test(body) ? `# ${title}\n\n${body}` : body;
}

/** The built page for a URL path, as `{ file, url }`, or null when VitePress wrote no file for it. */
function builtPage(outDir, url) {
  const path = url.endsWith("/") ? `${url}index.html` : url;
  const file = join(outDir, ...path.split("/").filter(Boolean));
  return existsSync(file) ? { file, url } : null;
}

/**
 * VitePress's `buildEnd` hook: after the build, writes `/sourcemap.json` ([format v0](../../spec/sourcemap/v0.md))
 * and a Markdown twin of every page, and links each twin from its page's `<head>`.
 */
export default async function slipway(siteConfig) {
  const { srcDir, outDir, site = {}, rewrites = {} } = siteConfig;
  const pages = Array.isArray(siteConfig.pages) ? siteConfig.pages : [];
  const base = typeof site.base === "string" ? site.base : "/";
  const map = { version: 0, pages: [] };
  let headings = 0;

  for (const page of [...pages].sort()) {
    const source = toPosix(page);
    if (!source.endsWith(".md")) continue; // A dynamic route's virtual path has no source file.
    const sourceFile = join(srcDir, ...source.split("/"));
    if (!existsSync(sourceFile)) continue;

    const built = builtPage(outDir, urlOfPage(source, rewrites.map?.[source]));
    if (!built) continue;

    const raw = readFileSync(sourceFile, "utf8");
    const html = readFileSync(built.file, "utf8");
    const found = headingsIn(html);
    headings += found.filter((heading) => heading.source).length;

    const sections = found
      .filter((heading) => heading.id && heading.source?.startsWith(`${source}:`))
      .map((heading) => ({ id: heading.id, level: heading.level, line: Number(heading.source.slice(source.length + 1)), text: heading.text }))
      .filter((section) => Number.isInteger(section.line) && section.line > 0);
    map.pages.push({ url: built.url, source, sections, links: linksIn(raw) });

    const twin = twinUrl(built.url);
    const twinFile = join(outDir, ...twin.split("/").filter(Boolean));
    mkdirSync(dirname(twinFile), { recursive: true });
    writeFileSync(twinFile, twinOf(raw, titleOf(raw)));

    const tag = `<link rel="alternate" type="text/markdown" href="${base}${twin.slice(1)}">`;
    if (!html.includes(tag)) writeFileSync(built.file, html.replace("</head>", `${tag}</head>`));
  }

  writeFileSync(join(outDir, "sourcemap.json"), `${JSON.stringify(map, null, 2)}\n`);
  if (map.pages.length && !headings) {
    console.warn("[slipway-vitepress] No heading has data-source: add sourcePlugin to markdown.config in .vitepress/config.mts.");
  }
}
