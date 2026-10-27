import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("a sample component used three times links its CSS once", { skip }, () => {
  const outDir = join(root, ".tmp/component-css-out");
  const testSite = join(root, ".tmp/component-css-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");
  writeFileSync(join(testSite, "index.md"), "---\nlayout: default\n---\nHello");
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
  {% include component-css.html name="sample" %}
  {% include component-css.html name="sample" %}
  {% include component-css.html name="sample" %}
</head>
<body>
  Test Page
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  const linkMatches = html.match(/<link rel="stylesheet" href="[^"]*\/assets\/css\/components\/sample\.css">/g);
  assert.ok(linkMatches, "Should link the component CSS");
  assert.equal(linkMatches.length, 1, "Should only link the component CSS once even if included three times");
});
