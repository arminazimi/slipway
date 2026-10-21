import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");

test("page inherits base and shows the title, an optional lead, and the body", () => {
  const page = read("_layouts/page.html");
  assert.match(page, /layout: base/);
  assert.match(page, /<h1>\{\{ page\.title \}\}<\/h1>/);
  assert.match(page, /if page\.description/);
  assert.match(page, /\{\{ content \}\}/);
});

test("page shows no date, tags, or navigation", () => {
  const page = read("_layouts/page.html");
  assert.doesNotMatch(page, /page\.date|page\.tags|<nav/);
});

test("the example site has a page that uses the layout", () => {
  assert.match(read("examples/minimal/about.md"), /layout: page/);
});
