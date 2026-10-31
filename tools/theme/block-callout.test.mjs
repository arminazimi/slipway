import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("callout block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-callout-out");
  const testSite = join(root, ".tmp/block-callout-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");
  mkdirSync(join(testSite, "_layouts"), { recursive: true });
  writeFileSync(join(testSite, "_layouts", "default.html"), `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>{{ content }}</body>
</html>`);

  // One include per case: each kind, an unknown type, the default, an escaped body, and no title.
  writeFileSync(join(testSite, "index.md"), `---
layout: default
note_body: Note body text.
tip_body: Tip body text.
warning_body: Warning body text.
danger_body: Danger body text.
unknown_body: Unknown body text.
default_body: Default body text.
escaped_body: Use <b>bold</b> & more.
plain_body: Plain body text.
---
{% include blocks/callout.html type="note" title="A note" body=page.note_body %}
{% include blocks/callout.html type="tip" title="A tip" body=page.tip_body %}
{% include blocks/callout.html type="warning" body=page.warning_body %}
{% include blocks/callout.html type="danger" title="A danger" body=page.danger_body %}
{% include blocks/callout.html type="info" body=page.unknown_body %}
{% include blocks/callout.html body=page.default_body %}
{% include blocks/callout.html body=page.escaped_body %}
{% include blocks/callout.html body=page.plain_body %}`);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");
  const asides = [...html.matchAll(/<aside class="sl-callout sl-callout-([a-z]+)" role="note">([\s\S]*?)<\/aside>/g)].map(
    (match) => ({ type: match[1], body: match[2] }),
  );
  const byBody = (text) => {
    const aside = asides.find((entry) => entry.body.includes(text));
    assert.ok(aside, `Should render a callout with "${text}"`);
    return aside;
  };

  assert.equal(asides.length, 8, "Should render one callout per include");

  for (const [type, body] of [
    ["note", "Note body text."],
    ["tip", "Tip body text."],
    ["warning", "Warning body text."],
    ["danger", "Danger body text."],
  ]) {
    assert.equal(byBody(body).type, type, `Should render the ${type} class`);
  }

  assert.equal(byBody("Unknown body text.").type, "note", "An unknown type should fall back to note");
  assert.ok(!html.includes("sl-callout-info"), "An unknown type should not render its own class");
  assert.equal(byBody("Default body text.").type, "note", "The default type should be note");

  assert.ok(byBody("Tip body text.").body.includes('<p class="sl-callout-title">A tip</p>'), "Should render the title when given");
  assert.ok(!byBody("Warning body text.").body.includes("sl-callout-title"), "Should omit the title when not given");

  assert.ok(html.includes("Use &lt;b&gt;bold&lt;/b&gt; &amp; more."), "Should escape the body");
  assert.ok(!html.includes("Use <b>bold</b>"), "Should not render raw HTML from the body");

  assert.match(
    html,
    /<link rel="stylesheet" href="\/assets\/css\/components\/callout\.css"\s*\/?>/,
    "Should link the callout component CSS",
  );
});
