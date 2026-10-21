import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");

test("home inherits the base layout and shows title, description, and an optional call to action", () => {
  const home = read("_layouts/home.html");
  assert.match(home, /layout: base/);
  assert.match(home, /<h1 class="sl-hero-title">\{\{ page\.title \}\}<\/h1>/);
  assert.match(home, /page\.description/);
  assert.match(home, /page\.cta_text and page\.cta_url/);
});

test("home renders the page body, then at most five latest posts only when posts exist", () => {
  const home = read("_layouts/home.html");
  assert.ok(home.indexOf("{{ content }}") < home.indexOf("site.posts"));
  assert.match(home, /slice: 0, 5/);
  assert.match(home, /sl_recent\.size > 0/);
});

test("the home styles use logical properties only", () => {
  const css = read("assets/css/slipway.css");
  const home = css.slice(css.indexOf("Home layout"));
  assert.doesNotMatch(home, /\b(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/);
});

test("the example site has a page that uses the home layout", () => {
  assert.match(read("examples/minimal/home.md"), /layout: home/);
});
