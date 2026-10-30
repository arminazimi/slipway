import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("chart block renders a data table and CSS bars", { skip }, () => {
  const outDir = join(root, ".tmp/block-chart-out");
  const testSite = join(root, ".tmp/block-chart-site");

  mkdirSync(join(testSite, "_data"), { recursive: true });
  writeFileSync(
    join(testSite, "_data/chart.yml"),
    `- label: Alpha
  value: 40
- label: Beta
  value: 30
- label: "Gamma & Delta"
  value: 10
`,
  );
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");
  mkdirSync(join(testSite, "_layouts"), { recursive: true });
  writeFileSync(
    join(testSite, "_layouts/default.html"),
    `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>{{ content }}</body>
</html>`,
  );
  writeFileSync(
    join(testSite, "index.md"),
    `---
layout: default
---
{% include blocks/chart.html data=site.data.chart caption="Downloads & more" %}

{% include blocks/chart.html data=site.data.chart max=80 %}`,
  );
  writeFileSync(
    join(testSite, "empty.md"),
    `---
layout: default
---
{% include blocks/chart.html data=page.nothing %}`,
  );

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.match(html, /<figure class="sl-chart">/, "Should render the chart figure");
  assert.match(html, /<figcaption>Downloads &amp; more<\/figcaption>/, "Should render and escape the caption");
  assert.match(html, /<table class="sl-chart-table">/, "Should render the data table");
  assert.match(html, /<th scope="row">Alpha<\/th>/, "Should render each label as a row header");
  assert.match(html, /<th scope="row">Gamma &amp; Delta<\/th>/, "Should escape labels");
  assert.match(html, /<td>40<span class="sl-chart-bar" style="--sl-chart-value: 100.0%"><\/span><\/td>/, "Should size the largest bar from the computed maximum");
  assert.match(html, /--sl-chart-value: 75\.0%/, "Should render the second bar at three quarters");
  assert.match(html, /--sl-chart-value: 25\.0%/, "Should render the third bar at a quarter");
  assert.match(html, /--sl-chart-value: 50\.0%/, "Should use an explicit max");
  assert.match(html, /--sl-chart-value: 37\.5%/, "Should size bars against an explicit max");
  assert.match(html, /--sl-chart-value: 12\.5%/, "Should size small bars against an explicit max");

  const link = /<link rel="stylesheet" href="\/assets\/css\/components\/chart\.css"\s*\/?>/g;
  assert.equal(html.match(link)?.length, 1, "Should link the chart component CSS once per page");

  const empty = readFileSync(join(outDir, "empty.html"), "utf8");
  assert.doesNotMatch(empty, /class="sl-chart"/, "Should render nothing without data");
});
