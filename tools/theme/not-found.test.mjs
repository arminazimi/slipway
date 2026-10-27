import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("the not-found strings exist in English and Persian", () => {
  const fa = read("_includes/i18n/fa.html");
  const en = read("_includes/i18n/en.html");
  for (const key of ["not_found_title", "not_found_text", "go_home"]) {
    assert.ok(fa.includes(`when '${key}'`) && en.includes(`when '${key}'`), key);
  }
});

test("base and the 404 layout share one direction rule", () => {
  assert.match(read("_layouts/base.html"), /include dir\.html/);
  assert.match(read("_layouts/not-found.html"), /include dir\.html/);
  assert.doesNotMatch(read("_layouts/base.html"), /fa,ar,he/);
});

test("the 404 page has a section per language with its own lang, dir, and home link", { skip }, () => {
  const out = buildExample("gem", tmpDir("404-site"));
  const html = readFileSync(join(out, "404.html"), "utf8");
  assert.match(html, /<section lang="en" dir="ltr">\s*<h2>Page not found<\/h2>/);
  assert.match(html, /<section lang="fa" dir="rtl">\s*<h2>صفحه پیدا نشد<\/h2>/);
  assert.match(html, /<section lang="de" dir="ltr">\s*<h2>Seite nicht gefunden<\/h2>/);
  for (const href of ["/", "/fa/", "/de/"]) assert.match(html, new RegExp(`class="sl-button" href="${href}"`));
  assert.match(html, /<title>Page not found<\/title>/);
});

test("the 404 page stays out of the sitemap and the search index", { skip }, () => {
  const out = buildExample("gem", tmpDir("404-site"));
  assert.doesNotMatch(readFileSync(join(out, "sitemap.xml"), "utf8"), /404/);
  assert.doesNotMatch(readFileSync(join(out, "search.json"), "utf8"), /Page not found/);
});
