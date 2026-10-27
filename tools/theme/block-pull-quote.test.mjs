import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("pull-quote block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-pull-quote-out");
  const testSite = join(root, ".tmp/block-pull-quote-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
---
{% include blocks/pull-quote.html text="Test Quote" author="Test Author" source="Test Source" url="https://example.com" %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
  {% include component-css.html name="pull-quote" %}
</head>
<body>
  {{ content }}
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.ok(html.includes('<figure class="sl-pull-quote">'), "Should render figure element");
  assert.ok(html.includes('<blockquote>'), "Should render blockquote element");
  assert.ok(html.includes('<p>Test Quote</p>'), "Should render text");
  assert.ok(html.includes('<figcaption>'), "Should render figcaption element");
  assert.ok(html.includes('<span class="sl-pull-quote-author">Test Author</span>'), "Should render author");
  assert.ok(html.includes('<a href="https://example.com">Test Source</a>'), "Should render source as link");
  assert.ok(html.includes('<link rel="stylesheet" href="/assets/css/components/pull-quote.css">'), "Should link the pull-quote component CSS");
});
