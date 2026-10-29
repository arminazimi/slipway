import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("blocks reference page renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/blocks-ref-out");
  const testSite = join(root, "site");

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "blocks/index.html"), "utf8");

  // Code blocks are syntax-highlighted into spans; compare the plain text.
  const text = html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");

  const blocksDir = join(root, "site/blocks");
  const blocks = readdirSync(blocksDir)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .map((f) => f.replace(".md", ""));

  for (const block of blocks) {
    assert.ok(html.toLowerCase().includes(block.replace("-", " ")), `Should mention ${block}`);

    // Check if the snippet is mentioned. Markdown processor might encode characters.
    // E.g. {% include blocks/... %} might become something completely different or just part of a <code> block.
    // The most robust check is a simple regex that matches `include blocks/name.html` ignoring any surrounding characters
    assert.match(text, new RegExp(`include blocks/${block}\\.html`));
  }
});
