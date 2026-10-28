import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("timeline block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-timeline-out");
  const testSite = join(root, ".tmp/block-timeline-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
events:
  - date: 2026-11-23
    title: Phase 3 begins
    description: The third phase starts
  - date: 2026-12-01
    title: Feature implemented
    url: /feature/
---
{% include blocks/timeline.html events=page.events %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
  {% include component-css.html name="timeline" %}
</head>
<body>
  {{ content }}
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.ok(html.includes('<div class="sl-timeline">'), "Should render timeline wrapper");
  assert.ok(html.includes('<ol>'), "Should render ordered list");
  assert.ok(/<time datetime="2026-11-23T00:00:00[^"]*">November 23, 2026<\/time>/.test(html), "Should render time with format");
  assert.ok(html.includes('<a href="/feature/">Feature implemented</a>'), "Should render links for events with urls");
  // Kramdown on classic pages adds class="language-plaintext highlighter-rouge" to inline code etc. We relax the description text test to ignore HTML tags inside the description.
  assert.ok(html.includes('The third phase starts'), "Should render description text");
  assert.ok(html.includes('<link rel="stylesheet" href="/assets/css/components/timeline.css">'), "Should link the timeline component CSS");
});
