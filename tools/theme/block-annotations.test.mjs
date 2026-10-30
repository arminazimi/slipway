import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("annotations block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-annotations-out");
  const testSite = join(root, ".tmp/block-annotations-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");
  mkdirSync(join(testSite, "_layouts"), { recursive: true });
  writeFileSync(join(testSite, "_layouts", "default.html"), `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>{{ content }}</body>
</html>`);

  writeFileSync(join(testSite, "index.md"), `---
layout: default
caption: Fetching a user.
language: javascript
code: |-
  if (user.id < 10) { // 1
    fetch("/api?x=1&y=2"); // 2
  }
notes:
  - text: The id check keeps small ids.
  - A plain string note.
---
{% include blocks/annotations.html caption=page.caption language=page.language code=page.code notes=page.notes %}`);

  writeFileSync(join(testSite, "empty.md"), `---
layout: default
notes:
  - This note is ignored.
---
{% include blocks/annotations.html notes=page.notes %}`);

  writeFileSync(join(testSite, "prefixed.md"), `---
layout: default
code: |-
  run(); // 1
notes:
  - The second copy on a page.
---
{% include blocks/annotations.html code=page.code notes=page.notes id_prefix="example" %}`);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.ok(html.includes('<figure class="sl-annotations">'), "Should render the annotations figure");
  assert.ok(html.includes("<figcaption>Fetching a user.</figcaption>"), "Should render the caption");
  assert.ok(
    html.includes('<pre dir="ltr"><code class="language-javascript">'),
    "Should render a left-to-right code block with the language class",
  );
  assert.ok(html.includes("if (user.id &lt; 10) { // 1"), "Should keep the author's marker and escape the code");
  assert.ok(html.includes('fetch(&quot;/api?x=1&amp;y=2&quot;); // 2'), "Should escape quotes and ampersands");
  assert.ok(html.includes('<ol class="sl-annotations-notes">'), "Should render the notes as an ordered list");
  assert.ok(
    html.includes('<li id="sl-annotation-1">The id check keeps small ids.</li>'),
    "Should read text from note objects",
  );
  assert.ok(html.includes('<li id="sl-annotation-2">A plain string note.</li>'), "Should accept plain string notes");
  assert.ok(
    html.includes('<link rel="stylesheet" href="/assets/css/components/annotations.css"'),
    "Should link the annotations component CSS",
  );

  const empty = readFileSync(join(outDir, "empty.html"), "utf8");
  assert.ok(!empty.includes("sl-annotations"), "Should render nothing when the code is empty");

  const prefixed = readFileSync(join(outDir, "prefixed.html"), "utf8");
  assert.ok(
    prefixed.includes('<li id="example-1">The second copy on a page.</li>'),
    "Should prefix note ids so two copies on one page stay unique",
  );
});
