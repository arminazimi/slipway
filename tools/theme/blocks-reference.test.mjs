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

  const blocksDir = join(root, "site/blocks");
  const blocks = readdirSync(blocksDir)
    .filter((f) => f.endsWith(".md") && f !== "index.md")
    .map((f) => f.replace(".md", ""));

  for (const block of blocks) {
    assert.ok(html.toLowerCase().includes(block.replace("-", " ")), `Should mention ${block}`);

    // Check if the exact phrase "include blocks/name.html" is present.
    // GitHub actions failed because `html.includes(...)` wasn't working due to the Markdown HTML escaping logic in CI.
    assert.ok(
      html.includes(`include blocks/${block}.html`),
      `Should include copyable snippet for ${block}`
    );
  }
});
