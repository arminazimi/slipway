import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const bare = join(root, "examples/bare");

test("the bare example is two files: a two-key _config.yml and index.md", () => {
  assert.deepEqual(readdirSync(bare).sort(), ["_config.yml", "index.md"]);
  const config = parse(readFileSync(join(bare, "_config.yml"), "utf8"));
  assert.deepEqual(Object.keys(config).sort(), ["remote_theme", "title"]);
  assert.equal(config.remote_theme, "arminazimi/slipway");
});

for (const mode of ["gem", "template"]) {
  test(`the bare example builds a complete page with nothing but the theme (${mode} mode)`, { skip }, () => {
    const out = buildExample(mode, tmpDir(`bare-${mode}`), "bare");
    const html = readFileSync(join(out, "index.html"), "utf8");
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /<a class="sl-skip-link" href="#main">[^<]+<\/a>/);
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.match(html, /<main id="main"/);
    assert.match(html, /<header class="sl-header">\s*<a class="sl-site-title" href="\/">Slipway bare<\/a>/);
    assert.match(html, /<footer class="sl-footer">/);
    assert.doesNotMatch(html, /href=""|src=""|undefined|\{\{|\{%/);
    // No search-index page, so no search field pointing at a missing /search.json.
    assert.doesNotMatch(html, /data-search=/);
  });
}
