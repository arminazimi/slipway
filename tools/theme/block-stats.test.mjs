import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("stats block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-stats-out");
  const testSite = join(root, ".tmp/block-stats-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
demo_stats:
  - label: Rules
    value: 516
  - label: Ecosystems
    value: 14
    unit: k
    trend: +2%
---
{% include blocks/stats.html items=page.demo_stats %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
  {% include component-css.html name="stats" %}
</head>
<body>
  {{ content }}
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.ok(html.includes('<div class="sl-stats">'), "Should render the container");
  assert.ok(html.includes('<span class="sl-stat-value">516</span>'), "Should render the value");
  assert.ok(html.includes('<span class="sl-stat-label">Rules</span>'), "Should render the label");
  assert.ok(html.includes('<span class="sl-stat-unit">k</span>'), "Should render the unit");
  assert.ok(html.includes('<span class="sl-stat-trend">+2%</span>'), "Should render the trend");
  assert.ok(html.includes('<link rel="stylesheet" href="/assets/css/components/stats.css">'), "Should link the stats component CSS");
});

test("stats block renders locale digits in RTL", { skip }, () => {
  const outDir = join(root, ".tmp/block-stats-rtl-out");
  const testSite = join(root, ".tmp/block-stats-rtl-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\nslipway:\n  persian:\n    digits: true\n");

  const pageContent = `---
layout: default
lang: fa
demo_stats:
  - label: Rules
    value: 516
    trend: +2%
---
{% include blocks/stats.html items=page.demo_stats %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });
  writeFileSync(join(testSite, "_layouts", "default.html"), "{{ content }}");

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  // 516 in Persian digits is ۵۱۶
  assert.ok(html.includes('<span class="sl-stat-value">۵۱۶</span>'), "Should convert value to Persian digits");
  // +2% in Persian digits is +۲%
  assert.ok(html.includes('<span class="sl-stat-trend">+۲%</span>'), "Should convert trend to Persian digits");
});
