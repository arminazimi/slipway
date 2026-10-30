import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("code group block renders tabs and panels", { skip }, () => {
  const outDir = join(root, ".tmp/block-code-group-out");
  const testSite = join(root, ".tmp/block-code-group-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
items:
  - label: npm
    language: bash
    code: |-
      npm install <package>
  - label: pnpm
    language: bash
    code: |-
      pnpm add <package>
---
{% include blocks/code-group.html items=page.items id="demo" %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });
  writeFileSync(join(testSite, "_layouts", "default.html"), `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>{{ content }}</body>
</html>`);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");
  const count = (needle) => html.split(needle).length - 1;

  assert.equal(count('type="radio"'), 2, "Should render one radio per item");
  assert.match(html, /<input[^>]*name="demo"[^>]*id="demo-1"[^>]*checked/, "Should check the first radio");
  const secondRadio = html.match(/<input[^>]*id="demo-2"[^>]*>/);
  assert.ok(secondRadio, "Should render the second radio");
  assert.ok(!secondRadio[0].includes("checked"), "Should leave the other radio unchecked");
  assert.match(html, /<label class="sl-code-group-tab" for="demo-1">npm<\/label>/, "Should label the first tab");
  assert.match(html, /<label class="sl-code-group-tab" for="demo-2">pnpm<\/label>/, "Should label the second tab");
  assert.equal(count('<pre class="sl-code-group-panel" dir="ltr">'), 2, "Should render one panel per item");
  assert.ok(html.includes('<code class="language-bash">'), "Should carry the language class");
  assert.ok(html.includes("npm install &lt;package&gt;"), "Should escape the code");
  assert.ok(!html.includes("<package>"), "Should not emit raw code as markup");
  assert.equal(
    count('href="/assets/css/components/code-group.css"'),
    1,
    "Should link the code group component CSS",
  );
});
