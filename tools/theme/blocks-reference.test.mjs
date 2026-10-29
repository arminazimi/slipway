import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
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

  const blocksDir = join(root, "site/blocks");
  const blocks = readdirSync(blocksDir)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .map((f) => f.replace(".md", ""));

  for (const block of blocks) {
    // Ensure the block is mentioned
    assert.ok(html.toLowerCase().includes(block.replace("-", " ")), `Should mention ${block}`);

    // The snippet is printed as text
    const snippetPattern = new RegExp(`{% include blocks/${block}\\.html`);
    assert.ok(snippetPattern.test(html), `Should include copyable snippet for ${block}`);
  }
});
