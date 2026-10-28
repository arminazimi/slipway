import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("file-tree block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-file-tree-out");
  const testSite = join(root, ".tmp/block-file-tree-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
---
{% capture my_markdown_list %}
- \`docs/\` *Documentation files*
  - \`README.md\`
{% endcapture %}

{% include blocks/file-tree.html list=my_markdown_list %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
  {% include component-css.html name="file-tree" %}
</head>
<body>
  {{ content }}
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.ok(html.includes('<div class="sl-file-tree">'), "Should render file-tree wrapper");
  assert.ok(html.includes('<ul>'), "Should render list correctly via markdownify");
  assert.ok(html.includes('<code>docs/</code>'), "Should render code tags");
  assert.ok(html.includes('<em>Documentation files</em>'), "Should render emphasis for notes");
  assert.ok(html.includes('<link rel="stylesheet" href="/assets/css/components/file-tree.css">'), "Should link the file-tree component CSS");
});
