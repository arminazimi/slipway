import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const print = read("assets/css/print.css");

test("the print stylesheet loads only for print, after the screen styles and before overrides", () => {
  const head = read("_includes/head.html");
  const line = head.split("\n").find((l) => l.includes("print.css"));
  assert.match(line, /media="print"/);
  assert.ok(head.indexOf("slipway.css") < head.indexOf("print.css"));
});

test("print forces the light palette even when dark was chosen", () => {
  assert.match(print, /:root,\s*:root\[data-theme\] \{\s*color-scheme: light;/);
});

test("print hides the header, navigation, and theme toggle", () => {
  assert.match(print, /\.sl-header,\s*\.sl-theme-toggle,\s*nav \{\s*display: none;/);
});

test("print shows external link addresses and keeps blocks and headings together", () => {
  assert.match(print, /a\[href\^="http"\]::after \{\s*content: " \(" attr\(href\) "\)"/);
  assert.match(print, /h1,\s*h2,\s*h3 \{\s*break-after: avoid;/);
  assert.match(print, /pre,\s*img,\s*blockquote \{\s*break-inside: avoid;/);
});

test("print uses logical properties only", () => {
  assert.doesNotMatch(print, /\b(margin|padding|border)-(left|right)\b|text-align:\s*(left|right)|float:\s*(left|right)/);
});
