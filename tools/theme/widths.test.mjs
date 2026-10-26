import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const css = read("assets/css/slipway.css");

test("base adds a width class only for the three known widths", () => {
  const base = read("_layouts/base.html");
  assert.match(base, /assign sl_width = page\.width/);
  assert.match(base, /sl_width == 'narrow' or sl_width == 'wide' or sl_width == 'full' %\} sl-width-\{\{ sl_width \}\}/);
});

test("each page width has a rule, built from the measure tokens", () => {
  assert.match(css, /\.sl-width-narrow \{\s*max-inline-size: var\(--sl-measure-narrow\);/);
  assert.match(css, /\.sl-width-wide \{\s*max-inline-size: var\(--sl-measure-wide\);/);
  assert.match(css, /\.sl-width-full \{\s*max-inline-size: none;/);
  const tokens = read("assets/css/tokens.css");
  assert.match(tokens, /--sl-measure-narrow: 34rem;/);
  assert.match(tokens, /--sl-measure-wide: 64rem;/);
});

test("wide and full-bleed sections break out of the column without a sideways scroll", () => {
  assert.match(css, /\.sl-wide \{[^}]*margin-inline: calc\(\(100% - var\(--sl-wide-size\)\) \/ 2\);/);
  assert.match(css, /\.sl-bleed \{[^}]*margin-inline: calc\(50% - 50vw\);/);
  assert.match(css, /body \{\s*overflow-x: clip;/);
  assert.match(css, /\.sl-layout-doc :is\(\.sl-wide, \.sl-bleed\) \{\s*inline-size: auto;\s*margin-inline: 0;/);
  assert.match(read("assets/css/print.css"), /\.sl-wide,\s*\.sl-bleed \{\s*inline-size: auto;\s*margin-inline: 0;/);
});

test("the front matter schema accepts the widths and nothing else", () => {
  const schema = JSON.parse(read("schema/front-matter/base.schema.json"));
  assert.deepEqual(schema.properties.width.enum, ["narrow", "wide", "full"]);
});
