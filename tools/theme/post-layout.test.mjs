import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");

test("post inherits base and shows title, date, reading time, and tags", () => {
  const post = read("_layouts/post.html");
  assert.match(post, /layout: base/);
  assert.match(post, /<h1>\{\{ page\.title \}\}<\/h1>/);
  assert.match(post, /page\.date/);
  assert.match(post, /number_of_words/);
  assert.match(post, /page\.tags/);
});

test("the post pager links the older post as previous and the newer one as next", () => {
  const post = read("_layouts/post.html");
  assert.match(post, /rel="prev" href="\{\{ page\.previous\.url/);
  assert.match(post, /rel="next" href="\{\{ page\.next\.url/);
});

test("the post styles use logical properties only", () => {
  const css = read("assets/css/slipway.css");
  const post = css.slice(css.indexOf("Post layout"));
  assert.doesNotMatch(post, /\b(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/);
});

test("the example site has posts that use the layout", () => {
  assert.match(read("examples/minimal/_posts/2026-10-18-hello-world.md"), /layout: post/);
});
