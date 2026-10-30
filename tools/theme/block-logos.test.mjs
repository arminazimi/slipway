import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("logos block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-logos-out");
  const testSite = join(root, ".tmp/block-logos-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
logos:
  - name: Acme
    image: /assets/img/acme.svg
    url: https://example.com/
    alt: Acme logo
  - name: "Globex & Co"
    image: /assets/img/globex.svg
---
{% include blocks/logos.html title="Trusted by" logos=page.logos %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);

  const emptyContent = `---
layout: default
---
{% include blocks/logos.html %}`;
  writeFileSync(join(testSite, "empty.md"), emptyContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
</head>
<body>
  {{ content }}
</body>
</html>`;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.ok(html.includes('<div class="sl-logos">'), "Should render the logos wrapper");
  assert.ok(html.includes('<p class="sl-logos-title">Trusted by</p>'), "Should render the optional title");
  assert.ok(html.includes("<ul>"), "Should render the logo list");
  assert.ok(html.includes('src="/assets/img/acme.svg"'), "Should resolve the logo image path");
  assert.ok(html.includes('alt="Acme logo"'), "Should use the logo alt text");
  assert.ok(html.includes('alt="Globex &amp; Co"'), "Should fall back to the escaped name when alt is missing");
  assert.equal((html.match(/loading="lazy"/g) ?? []).length, 2, "Should lazy-load every logo");
  assert.ok(html.includes('<a href="https://example.com/">'), "Should link logos that set a url");
  assert.equal((html.match(/<a /g) ?? []).length, 1, "Should not wrap logos without a url in a link");
  assert.match(
    html,
    /<link rel="stylesheet" href="\/assets\/css\/components\/logos\.css" ?\/?>/,
    "Should link the logos component CSS",
  );

  const emptyHtml = readFileSync(join(outDir, "empty.html"), "utf8");
  assert.ok(!emptyHtml.includes("sl-logos"), "Should render nothing without logos");
  assert.ok(!emptyHtml.includes("logos.css"), "Should not link the stylesheet without logos");
});
