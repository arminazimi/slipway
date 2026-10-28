import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("kbd block renders correctly with both variants", { skip }, () => {
  const outDir = join(root, ".tmp/block-kbd-out");
  const testSite = join(root, ".tmp/block-kbd-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
---
{% include blocks/kbd.html mac="⌘K" other="Ctrl+K" %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
  {% include component-css.html name="kbd" %}
</head>
<body>
  {{ content }}
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.ok(html.includes('<kbd class="sl-kbd" data-mac="⌘K" data-other="Ctrl+K">'), "Should render kbd container");
  assert.ok(html.includes('<span class="sl-kbd-mac">⌘K</span>'), "Should render mac variant");
  assert.ok(html.includes('<span class="sl-kbd-other">Ctrl+K</span>'), "Should render other variant");
  assert.ok(html.includes('<span class="sl-kbd-sep">/</span>'), "Should render separator");
  assert.ok(html.includes('<link rel="stylesheet" href="/assets/css/components/kbd.css">'), "Should link the kbd component CSS");
  assert.ok(html.includes('navigator.userAgent'), "Should include the script");
});
