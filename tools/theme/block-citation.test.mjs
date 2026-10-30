import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

import { startTags } from "../../packages/doctor/src/html.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("citation block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-citation-out");
  const testSite = join(root, ".tmp/block-citation-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
references:
  - id: 1
    text: Knuth, Donald E. The TeXbook.
    url: https://example.com/texbook
  - text: Berners-Lee, Tim. Universal Resource Identifiers.
---
The TeXbook covers this{% include blocks/citation.html ref=1 %}.

{% include blocks/citation.html references=page.references %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
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

  assert.ok(html.includes('<ol class="sl-citation-list" id="references">'), "Should render the list with the default id");
  assert.ok(html.includes('<li id="ref-1">Knuth, Donald E. The TeXbook. <a href="https://example.com/texbook"'), "Should use the entry id");
  assert.ok(html.includes('<li id="ref-2">Berners-Lee, Tim. Universal Resource Identifiers.</li>'), "Should number entries without an id");
  assert.ok(html.includes('<span class="sl-citation"><a href="#ref-1">[1]</a></span>'), "Should link the cite to its entry");
  assert.ok(
    startTags(html).some(
      (tag) =>
        tag.name === "link" &&
        tag.attributes.get("rel") === "stylesheet" &&
        tag.attributes.get("href") === "/assets/css/components/citation.css",
    ),
    "Should link the citation component CSS",
  );
});
