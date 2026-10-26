// Slipway's Docusaurus adapter: a plugin that writes /sourcemap.json and a Markdown twin of every page
// after the build, and a remark plugin that puts data-source="<source>:<line>" on every heading.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { headingsIn, lineOffset, linksIn, splitFrontMatter } from "./markdown.mjs";

const markdown = /\.mdx?$/;
const configs = ["js", "mjs", "cjs", "ts", "mts", "cts"].map((ext) => `docusaurus.config.${ext}`);
const siteDirs = new Map();

/** The folder holding `docusaurus.config.*` at or above `dir`, or null. */
function siteDirOf(dir) {
  if (!siteDirs.has(dir)) {
    const parent = dirname(dir);
    siteDirs.set(dir, configs.some((name) => existsSync(join(dir, name))) ? dir : parent === dir ? null : siteDirOf(parent));
  }
  return siteDirs.get(dir);
}

const toPosix = (path) => path.split(sep).join("/");
const inside = (path) => path && !path.startsWith("..") && !isAbsolute(path);

/**
 * Remark plugin for the docs, blog, and pages plugins (`remarkPlugins: [remarkSource]`): adds
 * `data-source="<source>:<line>"` to every Markdown heading, with the source path relative to the
 * site folder and the line counted from the top of the file, front matter included.
 */
export function remarkSource() {
  return (tree, file) => {
    const path = file.path ?? file.history?.[0];
    if (!path || !markdown.test(path)) return;
    const siteDir = siteDirOf(dirname(path));
    const source = siteDir && toPosix(relative(siteDir, path));
    if (!inside(source)) return;
    const offset = lineOffset(readFileSync(path, "utf8"), String(file.value ?? ""));
    const walk = (node) => {
      if (node.type === "heading" && node.position) {
        node.data ??= {};
        node.data.hProperties = { ...node.data.hProperties, "data-source": `${source}:${node.position.start.line + offset}` };
      }
      for (const child of node.children ?? []) walk(child);
    };
    walk(tree);
  };
}

/**
 * Every page a content plugin made from a Markdown file: any object in a plugin's content with a
 * `permalink` and a `source` under the site folder (docs, blog posts, Markdown pages, and plugins
 * shaped like them), with `path`, its permalink without the base URL. Sorted by path, one entry per path.
 */
export function contentPages(plugins, { siteDir, baseUrl = "/" }) {
  const pages = new Map();
  const seen = new Set();
  const visit = (value) => {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (typeof value.permalink === "string" && typeof value.source === "string") {
      const file = value.source.startsWith("@site/") ? value.source.slice("@site/".length) : toPosix(relative(siteDir, value.source));
      if (inside(file) && markdown.test(file) && value.permalink.startsWith(baseUrl)) {
        const path = `/${value.permalink.slice(baseUrl.length)}`;
        if (!pages.has(path)) pages.set(path, { path, source: file, title: value.title ?? value.frontMatter?.title });
      }
    }
    for (const child of Array.isArray(value) ? value : Object.values(value)) visit(child);
  };
  for (const plugin of plugins) visit(plugin.content);
  return [...pages.values()].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/**
 * The built page for a permalink, as `{ file, url }`: `url` is the path of the file from the output
 * folder's root, with `index.html` dropped (`/docs/intro/`), so it resolves to the file on any host.
 * Docusaurus writes `<path>/index.html` by default and `<path>.html` with `trailingSlash: false`.
 */
function builtPage(outDir, path) {
  const parts = path.split("/").filter(Boolean);
  const candidates = path.endsWith("/") || !parts.length ? [[...parts, "index.html"]] : [[...parts.slice(0, -1), `${parts.at(-1)}.html`], [...parts, "index.html"]];
  for (const candidate of candidates) {
    const file = join(outDir, ...candidate);
    if (existsSync(file)) return { file, url: `/${candidate.join("/")}`.replace(/(^|\/)index\.html$/, "$1") };
  }
  return null;
}

/** The twin's URL path: the page's address with `.md` instead of `.html`, or `index.md` under an address that ends in `/`. */
export const twinUrl = (url) => (url.endsWith("/") ? `${url}index.md` : `${url.replace(/\.html$/, "")}.md`);

/** The twin: the page's Markdown as written, without front matter, under a title heading unless it starts with one. */
export function twinOf(raw, title) {
  const body = splitFrontMatter(raw).body.replace(/^\s*\n/, "");
  return title && !/^#[ \t]/.test(body) ? `# ${title}\n\n${body}` : body;
}

export default function slipway(context) {
  return {
    name: "slipway-docusaurus",
    async postBuild({ outDir, plugins }) {
      const { siteDir, baseUrl } = context;
      const map = { version: 0, pages: [] };
      let headings = 0;
      for (const page of contentPages(plugins, { siteDir, baseUrl })) {
        const built = builtPage(outDir, page.path);
        if (!built) continue;
        const { file, url } = built;
        const raw = readFileSync(join(siteDir, ...page.source.split("/")), "utf8");
        const html = readFileSync(file, "utf8");
        const found = headingsIn(html);
        headings += found.filter((h) => h.source).length;
        const sections = found
          .filter((h) => h.id && h.source?.startsWith(`${page.source}:`))
          .map((h) => ({ id: h.id, level: h.level, line: Number(h.source.slice(page.source.length + 1)), text: h.text }))
          .filter((section) => Number.isInteger(section.line) && section.line > 0);
        map.pages.push({ url, source: page.source, sections, links: linksIn(raw) });

        const twin = twinUrl(url);
        const twinFile = join(outDir, ...twin.split("/").filter(Boolean));
        mkdirSync(dirname(twinFile), { recursive: true });
        writeFileSync(twinFile, twinOf(raw, page.title));
        const tag = `<link rel="alternate" type="text/markdown" href="${baseUrl}${twin.slice(1)}">`;
        if (!html.includes(tag)) writeFileSync(file, html.replace("</head>", `${tag}</head>`));
      }
      writeFileSync(join(outDir, "sourcemap.json"), `${JSON.stringify(map, null, 2)}\n`);
      if (map.pages.length && !headings) {
        console.warn("[slipway-docusaurus] No heading has data-source: add remarkSource to remarkPlugins in the docs, blog, and pages options.");
      }
    },
  };
}
