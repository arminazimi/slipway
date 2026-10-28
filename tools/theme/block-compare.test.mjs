import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("compare block renders pros/cons and feature matrix correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-compare-out");
  const testSite = join(root, ".tmp/block-compare-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
pros:
  - Good 1
  - Good 2
cons:
  - Bad 1
headers:
  - Col 1
  - Col 2
features:
  - label: Feat 1
    values: ["yes", "no"]
  - label: Feat 2
    values: ["partial", ""]
---
{% include blocks/compare.html pros=page.pros cons=page.cons %}
{% include blocks/compare.html headers=page.headers features=page.features %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
  {% include component-css.html name="compare" %}
</head>
<body>
  {{ content }}
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  mkdirSync(join(testSite, "_data", "i18n"), { recursive: true });
  writeFileSync(join(testSite, "_data", "i18n", "en.yml"), "yes: Yes\nno: No\npartial: Partial\n");

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  // Check CSS is included
  assert.ok(html.includes('<link rel="stylesheet" href="/assets/css/components/compare.css">'), "Should link the compare component CSS");

  // Pros/Cons checks
  assert.ok(html.includes('<div class="sl-compare sl-compare-pros-cons">'), "Should render pros/cons container");
  assert.ok(html.includes('<div class="sl-compare-pros">'), "Should render pros list");
  assert.ok(html.includes('Good 1</span>'), "Should render pros content");
  assert.ok(html.includes('<div class="sl-compare-cons">'), "Should render cons list");
  assert.ok(html.includes('Bad 1</span>'), "Should render cons content");

  // Matrix checks
  assert.ok(html.includes('<div class="sl-compare sl-compare-matrix">'), "Should render matrix container");
  assert.ok(html.includes('<th scope="col">Col 1</th>'), "Should render headers");
  assert.ok(html.includes('<th scope="row">Feat 1</th>'), "Should render feature labels");
  assert.ok(html.includes('sl-compare-cell-yes'), "Should render yes cell");
  assert.ok(html.includes('sl-compare-cell-no'), "Should render no cell");
  assert.ok(html.includes('sl-compare-cell-partial'), "Should render partial cell");

  // Hidden text for a11y
  assert.ok(html.includes('<span class="sl-sr-only">Yes</span>'), "Should render hidden text for yes");
  assert.ok(html.includes('<span class="sl-sr-only">No</span>'), "Should render hidden text for no");
});
