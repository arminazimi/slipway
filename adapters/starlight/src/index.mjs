// Slipway's Astro Starlight adapter: an integration that writes /sourcemap.json and a Markdown
// twin of every docs page after the build, plus the Sätteri Markdown plugin that puts
// data-source="<source>:<line>" on every heading.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { remarkSource } from "./plugin.mjs";
import { headingsIn, linksIn, splitFrontMatter, titleOf } from "./markdown.mjs";

const toPosix = (path) => path.split(sep).join("/");
const markdown = /\.mdx?$/;
const contentDir = "src/content/docs";

/** The twin's URL path: the page's address with `.md` instead of `.html`, or `index.md` under an address that ends in `/`. */
export const twinUrl = (url) => (url.endsWith("/") ? `${url}index.md` : `${url.replace(/\.html$/, "")}.md`);

/** The twin: the page's Markdown as written, without front matter, under a title heading unless it starts with one. */
export function twinOf(raw, title) {
  const body = splitFrontMatter(raw).body.replace(/^\s*\n/, "");
  return title && !/^#[ \t]/.test(body) ? `# ${title}\n\n${body}` : body;
}

/**
 * The URL Starlight gives a content file: the path from `src/content/docs/` without its
 * extension, and without a final `index`, as a folder. `guides/intro.md` is `/guides/intro/`,
 * `guides/index.md` is `/guides/`, and the top `index.md` is `/`. Starlight's content layer
 * derives the slug from the file path, so there is no front matter `slug` to read.
 */
export function urlOf(source) {
  const path = source.slice(`${contentDir}/`.length).replace(markdown, "").replace(/(^|\/)index$/, "").replace(/^\/+|\/+$/g, "");
  return path ? `/${path}/` : "/";
}

/** The files under the content folder with a Markdown extension, as paths from the site folder, sorted. */
function contentFiles(root) {
  const dir = join(root, ...contentDir.split("/"));
  const files = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
      const full = join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && markdown.test(entry.name)) files.push(toPosix(relative(root, full)));
    }
  };
  if (existsSync(dir)) walk(dir);
  return files.sort();
}

/** The built file for a URL: `<path>/index.html`, or `<path>.html` when the build writes files without folders. */
function builtFile(outDir, url, trailingSlash) {
  const file = url.endsWith("/") ? `${url}index.html` : url;
  const candidates = trailingSlash === "never" ? [url.replace(/\/$/, "") + ".html", file] : [file, url.replace(/\/$/, "") + ".html"];
  for (const candidate of candidates) {
    const path = join(outDir, ...candidate.split("/").filter(Boolean));
    if (existsSync(path)) return { file: path, html: readFileSync(path, "utf8") };
  }
  return null;
}

/** The sections of a page: headings the Markdown plugin marked, in the order the page shows them. */
function sectionsOf(html, source) {
  return headingsIn(html)
    .filter((heading) => heading.id && heading.source?.startsWith(`${source}:`))
    .map((heading) => ({ id: heading.id, level: heading.level, line: Number(heading.source.slice(source.length + 1)), text: heading.text }))
    .filter((section) => Number.isInteger(section.line) && section.line > 0);
}

export default function slipway() {
  let root = null;
  let base = "/";
  let trailingSlash = "ignore";
  return {
    name: "slipway-starlight",
    hooks: {
      "astro:config:done": ({ config }) => {
        root = fileURLToPath(config.root);
        base = config.base ?? "/";
        trailingSlash = config.trailingSlash ?? "ignore";
      },
      "astro:build:done": ({ dir }) => {
        if (!root) return;
        const outDir = fileURLToPath(dir);
        const map = { version: 0, pages: [] };
        for (const source of contentFiles(root)) {
          const raw = readFileSync(join(root, ...source.split("/")), "utf8");
          const url = urlOf(source);
          const built = builtFile(outDir, url, trailingSlash);
          if (!built) continue;
          map.pages.push({ url, source, sections: sectionsOf(built.html, source), links: linksIn(raw) });

          const twin = twinUrl(url);
          const twinFile = join(outDir, ...twin.split("/").filter(Boolean));
          mkdirSync(dirname(twinFile), { recursive: true });
          writeFileSync(twinFile, twinOf(raw, titleOf(raw)));
          const href = `${base.replace(/\/$/, "")}/${twin.replace(/^\//, "")}`;
          const tag = `<link rel="alternate" type="text/markdown" href="${href}">`;
          if (!built.html.includes(tag)) writeFileSync(built.file, built.html.replace("</head>", `${tag}</head>`));
        }
        writeFileSync(join(outDir, "sourcemap.json"), `${JSON.stringify(map, null, 2)}\n`);
      },
    },
  };
}

export { remarkSource };
