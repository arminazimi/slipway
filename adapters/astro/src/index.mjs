// Slipway's Astro adapter: an integration that writes /sourcemap.json and a Markdown twin of every page
// after the build, and a remark plugin that puts data-source="<source>:<line>" on every heading.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { headingsIn, lineOffset, linksIn, splitFrontMatter } from "./markdown.mjs";
import yaml from "yaml";

const markdown = /\.mdx?$/;
const toPosix = (path) => path.split(sep).join("/");
const inside = (path) => path && !path.startsWith("..") && !isAbsolute(path);

/**
 * Remark plugin for Astro: adds `data-source="<source>:<line>"` to every Markdown heading.
 */
export function remarkSource() {
  return (tree, file) => {
    const path = file.history?.[0];
    if (!path || !markdown.test(path)) return;
    const siteDir = process.env.SLIPWAY_ASTRO_SITE_DIR || process.cwd();
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

/** The twin's URL path: the page's address with `.md` instead of `.html`, or `index.md` under an address that ends in `/`. */
export const twinUrl = (url) => (url.endsWith("/") ? `${url}index.md` : `${url.replace(/\.html$/, "")}.md`);

/** The twin: the page's Markdown as written, without front matter, under a title heading unless it starts with one. */
export function twinOf(raw, title) {
  const body = splitFrontMatter(raw).body.replace(/^\s*\n/, "");
  return title && !/^#[ \t]/.test(body) ? `# ${title}\n\n${body}` : body;
}

function getTitle(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (match) {
        try {
            const fm = yaml.parse(match[1]);
            if (fm && typeof fm === "object" && typeof fm.title === "string") {
                return fm.title;
            }
        } catch (e) {}
    }
    return null;
}

export default function slipway() {
  let format = 'directory';
  return {
    name: "slipway-astro",
    hooks: {
      "astro:config:setup": ({ updateConfig, config }) => {
        process.env.SLIPWAY_ASTRO_SITE_DIR = fileURLToPath(config.root);
        format = config.build.format;
        updateConfig({
          markdown: {
            remarkPlugins: [remarkSource],
          },
        });
      },
      "astro:build:done": async ({ dir, pages, routes }) => {
        const outDir = fileURLToPath(dir);
        const map = { version: 0, pages: [] };
        const siteDir = process.env.SLIPWAY_ASTRO_SITE_DIR || process.cwd();

        for (const page of pages) {
          const route = routes.find((r) => r.pathname === page.pathname || r.pathname + "/" === page.pathname || r.pathname === page.pathname + "/");

          if (!route || !route.component.match(/\.mdx?$/)) continue;

          // remove leading / and module ID prefix if present
          let sourcePath = route.component;
          if (sourcePath.startsWith("/")) sourcePath = sourcePath.slice(1);
          const sourceFile = join(siteDir, sourcePath);

          // Support both format: 'file' and format: 'directory'
          let builtFile = join(outDir, page.pathname);
          if (!builtFile.endsWith(".html")) {
              if (format === 'file') {
                 if (builtFile.endsWith("/")) builtFile = builtFile.slice(0, -1);
                 if (builtFile !== join(outDir, "")) builtFile += ".html";
                 else builtFile += "index.html"; // home page is always index.html
              } else {
                 if (!builtFile.endsWith("/")) builtFile += "/";
                 builtFile += "index.html";
              }
          }

          if (!existsSync(builtFile) && format === 'directory') {
              // fallback
              builtFile = join(outDir, page.pathname);
              if (builtFile.endsWith("/")) builtFile = builtFile.slice(0, -1);
              if (builtFile !== join(outDir, "")) builtFile += ".html";
              else builtFile += "index.html";
          }
          if (!existsSync(builtFile) && format === 'file') {
              builtFile = join(outDir, page.pathname);
              if (!builtFile.endsWith("/")) builtFile += "/";
              builtFile += "index.html";
          }

          let html = "";
          try {
            html = readFileSync(builtFile, "utf8");
          } catch (e) {
            continue;
          }

          let raw = "";
          try {
            raw = readFileSync(sourceFile, "utf8");
          } catch (e) {
            continue;
          }

          const foundHeadings = headingsIn(html);
          const sections = foundHeadings
            .filter((h) => h.id && h.source?.startsWith(`${sourcePath}:`))
            .map((h) => ({ id: h.id, level: h.level, line: Number(h.source.slice(sourcePath.length + 1)), text: h.text }))
            .filter((section) => Number.isInteger(section.line) && section.line > 0);

          let url = `/${page.pathname}`;
          if (!url.endsWith("/") && !url.endsWith(".html") && url !== "/") {
               if (format === 'directory') url += "/";
               else url += ".html";
          }

          map.pages.push({ url, source: sourcePath, sections, links: linksIn(raw) });

          const title = getTitle(raw);
          const twinPath = twinUrl(url);
          const twinFile = join(outDir, twinPath.replace(/^\//, ""));
          mkdirSync(dirname(twinFile), { recursive: true });
          writeFileSync(twinFile, twinOf(raw, title));

          const tag = `<link rel="alternate" type="text/markdown" href="${twinPath}">`;
          if (!html.includes(tag)) writeFileSync(builtFile, html.replace("</head>", `${tag}</head>`));
        }

        writeFileSync(join(outDir, "sourcemap.json"), `${JSON.stringify(map, null, 2)}\n`);
      },
    },
  };
}
