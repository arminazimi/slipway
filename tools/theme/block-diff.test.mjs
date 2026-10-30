import assert from "node:assert/strict";
import { readFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("diff block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-diff-out");
  const testSite = join(root, ".tmp/block-diff-site");

  rmSync(testSite, { recursive: true, force: true });
  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
removed: |-
  <div>port: 8080</div>
  name: old & stale
added: |-
  port: 9090
  name: new
---
{% include blocks/diff.html caption="Change the port" language="yaml" removed=page.removed added=page.added %}`;

  writeFileSync(join(testSite, "index.html"), pageContent);

  const oneSideContent = `---
layout: default
---
{% include blocks/diff.html added="port: 9090" %}`;

  writeFileSync(join(testSite, "one-side.html"), oneSideContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
</head>
<body>
  {{ content }}
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.ok(html.includes('<figure class="sl-diff">'), "Should render the figure");
  assert.ok(html.includes("<figcaption>Change the port</figcaption>"), "Should render the caption");
  assert.ok(html.includes('class="sl-diff-side sl-diff-removed"'), "Should render the removed side");
  assert.ok(html.includes('class="sl-diff-side sl-diff-added"'), "Should render the added side");
  assert.ok(html.includes('class="language-yaml"'), "Should render the language class");
  assert.ok(html.includes('<span class="sl-diff-sign" aria-hidden="true">−</span>'), "Should mark removed lines with a minus sign");
  assert.ok(html.includes('<span class="sl-diff-sign" aria-hidden="true">+</span>'), "Should mark added lines with a plus sign");
  assert.ok(html.includes("&lt;div&gt;port: 8080&lt;/div&gt;"), "Should escape the code");
  assert.ok(html.includes("name: old &amp; stale"), "Should escape ampersands");
  assert.equal((html.match(/class="sl-diff-line"/g) || []).length, 4, "Should render one line span per line");
  assert.ok(html.includes('<link rel="stylesheet" href="/assets/css/components/diff.css">'), "Should link the diff component CSS");
  assert.ok(!html.includes("<div>port: 8080</div>"), "Should not emit the code as markup");

  const oneSide = readFileSync(join(outDir, "one-side.html"), "utf8");
  assert.ok(oneSide.includes('class="sl-diff-side sl-diff-added"'), "Should render the side that has lines");
  assert.ok(!oneSide.includes("sl-diff-removed"), "Should skip the empty side");
  assert.ok(oneSide.includes('class="language-plaintext"'), "Should default the language");
  assert.ok(!oneSide.includes("<figcaption>"), "Should skip a missing caption");
});
