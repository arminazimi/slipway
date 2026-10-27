import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { validateFrontMatter } from "./front-matter.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("a post's series is a non-empty name", () => {
  assert.deepEqual(validateFrontMatter({ title: "x", layout: "post", series: "Writing for the web" }), []);
  assert.equal(validateFrontMatter({ title: "x", layout: "post", series: "" })[0].key, "series");
  assert.equal(validateFrontMatter({ title: "x", layout: "post", series: ["a"] })[0].key, "series");
});

test("the series box lists the posts of the series in the same language, oldest first", () => {
  assert.match(read("_layouts/post.html"), /include series\.html/);
  const box = read("_includes/series.html");
  assert.match(box, /where: 'series', page\.series \| reverse/);
  assert.match(box, /sl_s_post_lang == sl_s_lang/);
  assert.match(box, /aria-current="page"/);
  for (const key of ["series", "series_part", "series_pager", "previous", "next"]) assert.match(box, new RegExp(`key='${key}'`));
  const builtin = read("_includes/i18n-builtin.html");
  for (const key of ["series", "series_part", "series_pager"]) assert.equal(builtin.split(`when '${key}'`).length - 1, 14, key);
});

test("the series styles use logical properties only", () => {
  const css = read("assets/css/slipway.css");
  const start = css.indexOf("/* Post series");
  assert.ok(start > 0);
  assert.doesNotMatch(css.slice(start, css.indexOf("/* Authors")), /\b(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/);
});

test("the blog example shows the series box with each part and its neighbours", { skip }, () => {
  const out = buildExample("gem", join(root, ".tmp-series-site"), "blog");
  const html = (p) => readFileSync(join(out, p), "utf8");
  const first = html("2026/08/03/notes-on-type.html");
  assert.match(first, /<aside class="sl-series" aria-labelledby="sl-series-title">/);
  assert.match(first, /<span>Series<\/span> Writing for the web/);
  assert.match(first, /Part 1 of 2/);
  assert.match(first, /<li aria-current="page">Notes on type<\/li>/);
  assert.match(first, /<li><a href="\/2026\/10\/20\/why-plain-markdown\.html">Why plain Markdown<\/a><\/li>/);
  assert.match(first, /<a class="sl-series-next" href="\/2026\/10\/20\/why-plain-markdown\.html"><span>Next<\/span> Why plain Markdown<\/a>/);
  assert.doesNotMatch(first, /sl-series-prev/);
  const second = html("2026/10/20/why-plain-markdown.html");
  assert.match(second, /Part 2 of 2/);
  assert.match(second, /<a class="sl-series-prev" href="\/2026\/08\/03\/notes-on-type\.html"><span>Previous<\/span> Notes on type<\/a>/);
  assert.doesNotMatch(second, /sl-series-next/);
  assert.doesNotMatch(html("2026/09/12/a-slow-site-is-a-broken-site.html"), /sl-series/);
});
