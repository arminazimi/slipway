#!/usr/bin/env node
// Slipway's mdBook preprocessor: it strips a chapter's front matter and puts
// `<!-- slipway:<line> -->` before every chapter heading, with the heading's line in its source
// file. The renderer turns the markers into data-source attributes and the page's sections.
// mdBook runs it for the HTML renderer only.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { annotate, sourcePathOf, withoutFrontMatter } from "./markdown.mjs";

const args = process.argv.slice(2);
if (args[0] === "supports") process.exit(args[1] === "html" ? 0 : 1);

const [context, book] = JSON.parse(readFileSync(0, "utf8"));
const sourceDir = context.config?.book?.src ?? "src";

/** Annotates every chapter that has a source file. Included headings stay unmarked. */
function walk(items) {
  for (const item of items ?? []) {
    if (!item.Chapter) continue;
    const chapter = item.Chapter;
    if (typeof chapter.content === "string" && chapter.source_path) {
      const path = sourcePathOf(sourceDir, chapter.source_path);
      let source = null;
      try {
        source = readFileSync(join(context.root, ...path.split("/")), "utf8");
      } catch {
        // A chapter without a readable source still gets its own content lines.
      }
      chapter.content = annotate(withoutFrontMatter(chapter.content), source);
    }
    walk(chapter.sub_items);
  }
}

walk(book.items);
process.stdout.write(JSON.stringify(book));
