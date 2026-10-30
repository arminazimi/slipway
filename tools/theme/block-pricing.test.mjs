import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("pricing block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-pricing-out");
  const testSite = join(root, ".tmp/block-pricing-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
plans:
  - name: Starter
    price: $0
    period: /month
    description: For side projects.
    features:
      - One site
      - Community support
    cta_label: Start free
    cta_url: /signup/
  - name: Pro
    price: $19
    period: /month
    features:
      - Unlimited sites
      - Priority support
    cta_label: Choose Pro
    cta_url: /upgrade/
    highlighted: true
    highlight_label: Most popular
  - name: Enterprise
    price: Custom
    features:
      - Single sign-on
---
{% include blocks/pricing.html id="plans" plans=page.plans %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
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

  assert.ok(html.includes('<ul class="sl-pricing" id="plans">'), "Should render the plan list with its id");
  assert.ok(html.includes("<h3 class=\"sl-pricing-name\">Starter</h3>"), "Should render the plan name as a heading");
  assert.ok(html.includes('<span class="sl-pricing-amount">$0</span>'), "Should render the plan price");
  assert.ok(html.includes('<span class="sl-pricing-amount">$19</span> <span class="sl-pricing-period">/month</span>'), "Should render the period next to the price");
  assert.ok(html.includes('<p class="sl-pricing-description">For side projects.</p>'), "Should render the description");
  assert.ok(html.includes("<li>Unlimited sites</li>"), "Should render each feature");
  assert.ok(html.includes('<li class="sl-pricing-plan sl-pricing-featured">'), "Should mark the highlighted plan");
  assert.equal((html.match(/sl-pricing-featured/g) || []).length, 1, "Should mark only one plan");
  assert.ok(html.includes('<p class="sl-pricing-badge">Most popular</p>'), "Should render the highlight label as visible text");
  assert.ok(html.includes('<a class="sl-button sl-pricing-cta" href="/signup/">Start free</a>'), "Should render the call to action");
  assert.ok(html.includes('<a class="sl-button sl-pricing-cta" href="/upgrade/">Choose Pro</a>'), "Should render the highlighted plan's call to action");
  assert.equal((html.match(/sl-pricing-cta/g) || []).length, 2, "Should omit the call to action when the label or URL is missing");
  assert.match(html, /<link rel="stylesheet" href="\/assets\/css\/components\/pricing\.css"/, "Should link the pricing component CSS");
});
