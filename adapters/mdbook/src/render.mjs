#!/usr/bin/env node
// Slipway's mdBook renderer, the post-build step: after the HTML renderer, it adds
// data-source to headings, writes a Markdown twin of every chapter and /sourcemap.json, and links
// each twin from its page. It reads the source chapter, so the markers the preprocessor inserted
// must be in the book; if they are not, the map has no sections and the build warns.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { linksIn, pageUrl, sourcePathOf, twinOf, twinPath, twinUrl } from "./markdown.mjs";
import { applyMarkers, stripMarkers } from "./postprocess.mjs";

const context = JSON.parse(readFileSync(0, "utf8"));
const root = context.root;
const sourceDir = context.config?.book?.src ?? "src";

/** The folder holding the HTML pages: the renderer's own destination, or the `html` folder beside it on mdBook 0.5. */
function htmlDirectory(destination) {
  const own = resolve(destination);
  const isSite = (dir) => existsSync(join(dir, ".nojekyll")) || existsSync(join(dir, "index.html")) || existsSync(join(dir, "404.html"));
  if (isSite(own)) return own;
  const sibling = join(dirname(own), "html");
  return isSite(sibling) ? sibling : own;
}

/** Every chapter in the book, in reading order. */
function chapters(items, result = []) {
  for (const item of items ?? []) {
    if (!item.Chapter) continue;
    result.push(item.Chapter);
    chapters(item.Chapter.sub_items, result);
  }
  return result;
}

/** Adds the twin's link to the page's `<head>` unless it is already there. */
function withTwin(html, href) {
  if (/type=["']text\/markdown["']/i.test(html)) return html;
  const tag = `<link rel="alternate" type="text/markdown" href="${href}">`;
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${tag}\n</head>`) : html;
}

const htmlDir = htmlDirectory(context.destination);
const map = { version: 0, pages: [] };
let sections = 0;

for (const chapter of chapters(context.book?.items)) {
  const path = chapter.path ?? chapter.source_path;
  if (!path || !chapter.source_path) continue;
  const source = sourcePathOf(sourceDir, chapter.source_path);
  const sourceFile = join(root, ...source.split("/"));
  const builtPath = path.replace(/\.md$/i, ".html");
  const builtFile = join(htmlDir, ...builtPath.split("/"));
  if (!existsSync(sourceFile) || !existsSync(builtFile)) continue;

  const raw = readFileSync(sourceFile, "utf8");
  const processed = applyMarkers(readFileSync(builtFile, "utf8"), source);
  sections += processed.sections.length;

  const url = pageUrl(builtPath);
  const twin = twinUrl(url);
  writeFileSync(builtFile, withTwin(processed.html, twin));

  const twinFile = join(htmlDir, ...twinPath(builtPath).split("/"));
  mkdirSync(dirname(twinFile), { recursive: true });
  writeFileSync(twinFile, twinOf(raw, chapter.name));

  map.pages.push({ url, source, sections: processed.sections, links: linksIn(raw) });
}

const print = join(htmlDir, "print.html");
if (existsSync(print)) writeFileSync(print, stripMarkers(readFileSync(print, "utf8")));
writeFileSync(join(htmlDir, "sourcemap.json"), `${JSON.stringify(map, null, 2)}\n`);

if (map.pages.length && !sections) {
  console.warn("[slipway-mdbook] No heading carried a source marker: add [preprocessor.slipway] to book.toml.");
}
