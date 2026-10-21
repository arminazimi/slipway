import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");

test("doc inherits base and reads the sidebar from _data/navigation.yml", () => {
  const doc = read("_layouts/doc.html");
  assert.match(doc, /layout: base/);
  assert.match(doc, /site\.data\.navigation\.docs/);
  assert.match(doc, /aria-current="page"/);
});

test("the sidebar collapses with details and summary, no script", () => {
  const doc = read("_layouts/doc.html");
  assert.match(doc, /<details class="sl-doc-nav">/);
  assert.doesNotMatch(doc, /<script/);
});

test("the table of contents is built from h2 and h3 ids at build time", () => {
  const doc = read("_layouts/doc.html");
  assert.match(doc, /split: '<h'/);
  assert.match(doc, /sl-toc-\{\{ sl_level \}\}/);
});

test("previous and next links follow the order of navigation.yml", () => {
  const doc = read("_layouts/doc.html");
  assert.match(doc, /rel="prev"/);
  assert.match(doc, /rel="next"/);
});

test("the doc styles use logical properties only", () => {
  const css = read("assets/css/slipway.css");
  const doc = css.slice(css.indexOf("Doc layout"));
  assert.doesNotMatch(doc, /\b(left|right|margin-left|margin-right|padding-left|padding-right|border-left|border-right)\s*:/);
});

test("every navigation entry in the example points at a page that uses the doc layout", () => {
  const nav = parse(read("examples/minimal/_data/navigation.yml"));
  assert.ok(nav.docs.length >= 3);
  for (const item of nav.docs) {
    const pages = ["index", "layouts", "tokens"].map((n) => read(`examples/minimal/docs/${n}.md`));
    assert.ok(pages.some((p) => p.includes(`permalink: ${item.url}`) && p.includes("layout: doc")), item.url);
  }
});
