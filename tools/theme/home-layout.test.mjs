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
  assert.match(home, /page\.posts_limit \| default: 5/);
  assert.match(home, /sl_shown >= sl_limit/);
  assert.match(home, /sl_shown > 0/);
});

test("home has four variants, editorial by default", () => {
  const home = read("_layouts/home.html");
  assert.match(home, /page\.variant \| default: 'editorial'/);
  for (const variant of ["landing", "blog", "docs"]) assert.match(home, new RegExp(`sl_variant == '${variant}'`));
  const schema = JSON.parse(read("schema/front-matter/home.schema.json"));
  assert.deepEqual(schema.properties.variant.enum, ["editorial", "landing", "blog", "docs"]);
});

test("the landing variant shows the features and repeats the call to action", () => {
  const home = read("_layouts/home.html");
  const landing = home.slice(home.indexOf("sl_variant == 'landing'"), home.indexOf("sl_variant == 'docs'"));
  assert.match(landing, /for feature in page\.features/);
  assert.match(landing, /feature\.url/);
  assert.match(landing, /sl-cta-band/);
});

test("the blog variant lists every post by default under a compact heading", () => {
  const home = read("_layouts/home.html");
  assert.match(home, /page\.posts_limit \| default: site\.posts\.size/);
  assert.match(home, /<h1 class="sl-home-title">/);
});

test("the docs variant shows the docs navigation for the page's language", () => {
  const home = read("_layouts/home.html");
  assert.match(home, /'docs_' \| append: sl_nav_lang/);
  assert.match(home, /site\.data\.navigation\.docs/);
  assert.match(home, /key='docs_nav'/);
});

test("the home styles use logical properties only", () => {
  const css = read("assets/css/slipway.css");
  const home = css.slice(css.indexOf("Home layout"));
  assert.doesNotMatch(home, /\b(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/);
});

test("the examples use every home variant", () => {
  assert.match(read("examples/minimal/home.md"), /layout: home\nvariant: landing\nfeatures:/);
  assert.match(read("examples/blog/index.md"), /variant: blog/);
  assert.match(read("examples/docs/index.md"), /variant: docs/);
  assert.doesNotMatch(read("examples/persian/index.md"), /variant:/);
});
