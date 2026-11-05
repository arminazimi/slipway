// Slipway's Quarto post-render step: writes /sourcemap.json and a Markdown twin of every page built
// from a .qmd or .md file, and links each twin from the page's <head>. Quarto runs it once per
// `quarto render` (see `project: post-render` in _quarto.yml), with the project folder as its
// working directory. `--site` and `--output` run it by hand.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { headingsIn, linksIn, titleOf, twinOf, twinUrl } from "./markdown.mjs";

const pageFile = /\.(qmd|md)$/i;
/** Folders Quarto does not render, plus dependencies of an executable document. */
const skippedFolders = new Set(["node_modules", "packrat", "renv", "site_libs"]);

const toPosix = (path) => path.split(sep).join("/");
const inside = (path) => path && !path.startsWith("..") && !isAbsolute(path);
const byUrl = (a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0);

/** Every source file Quarto renders as a page, as a forward-slash path from `site`, sorted. */
export function pageFilesIn(site, outDir) {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (full === outDir || skippedFolders.has(entry.name)) continue;
        if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
        walk(full);
      } else if (entry.isFile() && pageFile.test(entry.name) && !entry.name.startsWith("_") && !entry.name.startsWith(".")) {
        files.push(toPosix(relative(site, full)));
      }
    }
  };
  walk(site);
  return files.sort();
}

/**
 * The page's URL from the file Quarto writes: `index.html` becomes `/` or `/docs/`, so the URL
 * resolves to the file whatever the host does with extensions.
 */
export function urlOf(htmlPath) {
  if (htmlPath === "index.html") return "/";
  if (htmlPath.endsWith("/index.html")) return `/${htmlPath.slice(0, -"index.html".length)}`;
  return `/${htmlPath}`;
}

/**
 * Writes the map, the twins, and the twin links for every page in `site` whose built HTML is in
 * `outDir`. Returns the map. A source file Quarto did not render (a draft, or a `.md` outside the
 * project's `render` list) has no built page and is left out.
 */
export function writeSite({ site, outDir }) {
  const map = { version: 0, pages: [] };
  let stamped = 0;
  for (const source of pageFilesIn(site, outDir)) {
    if (!inside(source)) continue;
    const htmlPath = source.replace(pageFile, ".html");
    const htmlFile = join(outDir, ...htmlPath.split("/"));
    if (!existsSync(htmlFile) || !statSync(htmlFile).isFile()) continue;

    const raw = readFileSync(join(site, ...source.split("/")), "utf8");
    let html = readFileSync(htmlFile, "utf8");
    const url = urlOf(htmlPath);

    const sections = headingsIn(html)
      .filter((heading) => heading.id && heading.source?.startsWith(`${source}:`))
      .map((heading) => ({ id: heading.id, level: heading.level, line: Number(heading.source.slice(source.length + 1)), text: heading.text }))
      .filter((section) => Number.isInteger(section.line) && section.line > 0);
    stamped += sections.length;
    map.pages.push({ url, source, sections, links: linksIn(raw) });

    const twin = twinUrl(url);
    const twinFile = join(outDir, ...twin.split("/").filter(Boolean));
    mkdirSync(dirname(twinFile), { recursive: true });
    writeFileSync(twinFile, twinOf(raw, titleOf(raw)));

    const tag = `<link rel="alternate" type="text/markdown" href="${twin}">`;
    if (html.includes("</head>") && !html.includes(tag)) html = html.replace("</head>", `${tag}\n</head>`);
    writeFileSync(htmlFile, html);
  }

  map.pages.sort(byUrl);
  writeFileSync(join(outDir, "sourcemap.json"), `${JSON.stringify(map, null, 2)}\n`);
  if (map.pages.length && !stamped) {
    console.warn(
      "[slipway-quarto] No heading has both an id and data-source: copy _extensions/slipway, add `filters: [slipway]`, and set `format: html: section-divs: false` in _quarto.yml.",
    );
  }
  return map;
}

/** The value of `--name value` in the arguments, or undefined. */
function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Quarto runs project scripts from the project folder and gives the output folder in the environment.
  const site = resolve(argument("--site") ?? process.cwd());
  const outDir = resolve(site, argument("--output") ?? process.env.QUARTO_PROJECT_OUTPUT_DIR ?? "_site");
  writeSite({ site, outDir });
}
