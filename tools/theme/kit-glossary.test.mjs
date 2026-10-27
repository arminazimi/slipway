import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample, root } from "./build.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

for (const mode of ["gem", "template"]) {
  test(`the glossary kit renders definitions and links (${mode})`, { skip }, () => {
    const out = tmpDir(`kit-glossary-${mode}`);
    buildExample(mode, out, join(root, "tools/theme/fixtures/kit-glossary"));
    const html = readFileSync(join(out, "index.html"), "utf8");
    assert.match(html, /<a href="\/glossary\.html#slipway" class="sl-term" title="The static site template\.">Slipway<\/a>/);
    assert.match(html, /<link rel="stylesheet" href="\/assets\/css\/components\/glossary\.css"[^>]*>/);
  });

  test(`the glossary layout renders the definition list (${mode})`, { skip }, () => {
    const out = tmpDir(`kit-glossary-${mode}-2`);
    buildExample(mode, out, join(root, "tools/theme/fixtures/kit-glossary"));
    const html = readFileSync(join(out, "glossary.html"), "utf8");

    assert.match(html, /<dl class="sl-glossary">/);
    assert.match(html, /<dt id="slipway">Slipway<\/dt>/);
    assert.match(html, /<dd>The static site template\.<\/dd>/);
    assert.match(html, /<link rel="stylesheet" href="\/assets\/css\/components\/glossary\.css"[^>]*>/);
  });
}
