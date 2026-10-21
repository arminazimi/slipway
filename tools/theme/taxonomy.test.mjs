import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("tags, archive, and their includes exist and avoid the plugins GitHub Pages lacks", () => {
  for (const f of ["_layouts/tags.html", "_layouts/archive.html", "_includes/taxonomy.html", "_includes/post-item.html", "_includes/layout-url.html"]) {
    assert.ok(read(f).length > 0, f);
  }
  assert.match(read("_layouts/tags.html"), /taxonomy\.html terms=site\.tags kind="tag"/);
  assert.match(read("_layouts/tags.html"), /taxonomy\.html terms=site\.categories kind="category"/);
});

test("the tag styles use logical properties only", () => {
  const css = read("assets/css/slipway.css");
  assert.doesNotMatch(css.slice(css.indexOf("Tags, categories, and archive")), /\b(left|right|margin-left|margin-right)\s*:/);
});

test("tag and category pages list the posts of one language, with counts", { skip }, () => {
  const out = buildExample("gem", join(root, ".tmp-taxonomy-site"));
  const html = (p) => readFileSync(join(out, p), "utf8");
  const en = html("tags/index.html");
  assert.match(en, /<h3 id="tag-slipway">slipway <span class="sl-count">\(2\)<\/span>/);
  assert.match(en, /<h3 id="tag-notes">notes <span class="sl-count">\(1\)<\/span>/);
  assert.match(en, /<h3 id="category-news">news/);
  assert.doesNotMatch(en, /نمونه/);
  const fa = html("fa/tags/index.html");
  assert.match(fa, /<h3 id="tag-نمونه">نمونه <span class="sl-count">\(۳\)<\/span>/);
  assert.doesNotMatch(fa, /tag-slipway/);
});

test("posts link their tags and categories to the tags page of their language", { skip }, () => {
  const out = buildExample("gem", join(root, ".tmp-taxonomy-site"));
  const html = (p) => readFileSync(join(out, p), "utf8");
  const en = html("2026/10/18/hello-world.html");
  assert.match(en, /<a class="sl-tag" href="\/tags\/#tag-notes">notes<\/a>/);
  assert.match(en, /<a class="sl-tag" href="\/tags\/#category-news">news<\/a>/);
  assert.match(html("fa/post-1/index.html"), /href="\/fa\/tags\/#tag-نمونه"/);
});

test("the archive groups posts by year, in Jalali years for Persian when opted in", { skip }, () => {
  const out = buildExample("gem", join(root, ".tmp-taxonomy-site"));
  const html = (p) => readFileSync(join(out, p), "utf8");
  assert.match(html("archive/index.html"), /<h2 id="year-2026">2026<\/h2>/);
  const fa = html("fa/archive/index.html");
  assert.ok(fa.indexOf('id="year-1405"') < fa.indexOf('id="year-1404"'));
  assert.match(fa, /<h2 id="year-1404">۱۴۰۴<\/h2>/);
});

test("previous and next posts stay in the post's language", { skip }, () => {
  const out = buildExample("gem", join(root, ".tmp-taxonomy-site"));
  const html = (p) => readFileSync(join(out, p), "utf8");
  const second = html("2026/10/20/second-post.html");
  assert.match(second, /rel="prev" href="\/2026\/10\/18\/hello-world\.html"/);
  assert.doesNotMatch(second, /rel="next"/);
  const faMiddle = html("fa/post-2/index.html");
  assert.match(faMiddle, /rel="prev" href="\/fa\/post-1\/"/);
  assert.match(faMiddle, /rel="next" href="\/fa\/post-3\/"/);
});
