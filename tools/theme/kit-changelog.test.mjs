import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample, root } from "./build.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

for (const mode of ["gem", "template"]) {
  test(`the changelog layout renders the changelog (${mode})`, { skip }, () => {
    const out = tmpDir(`kit-changelog-${mode}`);
    buildExample(mode, out, join(root, "tools/theme/fixtures/changelog"));
    const html = readFileSync(join(out, "index.html"), "utf8");

    assert.match(html, /<h2 id="unreleased">/i);
    assert.match(html, /<h2 id="1-0-0">/i);
    assert.match(html, /<link rel="stylesheet" href="\/assets\/css\/components\/changelog\.css"[^>]*>/);
    assert.match(html, /<a href="#1-0-0">1\.0\.0<\/a>/);
    assert.match(html, /<a href="\/index\.xml" class="sl-changelog-feed">/);
  });
}
