import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("terminal block renders commands, output, and prompts", { skip }, () => {
  const outDir = join(root, ".tmp/block-terminal-out");
  const testSite = join(root, ".tmp/block-terminal-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
commands: |-
  npm install
  npm run test
output: |-
  Added 123 packages.
  Build successful.
---

<div data-theme="light">
{% include blocks/terminal.html commands=page.commands output=page.output %}
</div>

<div data-theme="dark">
{% include blocks/terminal.html commands=page.commands output=page.output prompt="%" %}
</div>

<div dir="rtl">
{% include blocks/terminal.html commands=page.commands output=page.output %}
</div>`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
  {% include component-css.html name="terminal" %}
</head>
<body>
  {{ content }}
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");
  const count = (needle) => html.split(needle).length - 1;

  assert.equal(
    count('<link rel="stylesheet" href="/assets/css/components/terminal.css">'),
    1,
    "Should link the terminal component CSS once, even with several blocks on the page",
  );
  assert.equal(count('<div class="sl-terminal" dir="ltr">'), 3, "Should keep the terminal left to right in every context");
  assert.ok(html.includes('<div data-theme="light">'), "Should render the light example");
  assert.ok(html.includes('<div data-theme="dark">'), "Should render the dark example");
  assert.ok(html.includes('<div dir="rtl">'), "Should render the right-to-left example");

  assert.ok(html.includes('class="sl-terminal-prompt" data-prompt="$"'), "Should use $ as the default prompt");
  assert.ok(html.includes('class="sl-terminal-prompt" data-prompt="%"'), "Should render a custom prompt");
  assert.equal(count('data-prompt="$"'), 4, "Should use the default prompt for both commands in the light and right-to-left examples");
  assert.equal(count('data-prompt="%"'), 2, "Should use the custom prompt for both commands in the dark example");

  assert.ok(html.includes("</span>npm install\n"), "Should render each command with a prompt");
  assert.ok(html.includes("</span>npm run test\n"), "Should split commands on newlines");
  assert.ok(html.includes('<code class="sl-terminal-output">Added 123 packages.'), "Should render command output");
  assert.ok(html.includes("Build successful."), "Should keep multiline output");
});
