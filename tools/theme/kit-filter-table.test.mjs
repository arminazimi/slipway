import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import vm from "node:vm";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";
import { tmpDir } from "./tmp.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const fixture = join(root, "tools/theme/fixtures/kit-filter");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

/** filter.js runs in the same global as search.js, which provides the normalization it reuses. */
function load() {
  const context = {};
  vm.runInNewContext(read("assets/js/search.js"), context);
  vm.runInNewContext(read("assets/js/filter.js"), context);
  return context.slipwayFilter;
}

test("filter matching ignores case, accents, Persian letter variants, and digits", () => {
  const { match } = load();
  assert.ok(match("Crème brûlée", "creme"));
  assert.ok(match("Résumé", "RESUME"));
  assert.ok(match("Plain row", "plain row"));
  assert.ok(!match("Plain row", "plain missing"));
  assert.ok(match("می‌خواهم", "میخواهم"));
  assert.ok(match("مُطْمَئِنّ", "مطمین"));
  assert.ok(match("۱۲۳", "123"));
  assert.ok(match("anything", "   "));
});

test("the filter field, stylesheet, and script render once, hidden until enhanced", { skip }, () => {
  const out = buildExample("gem", tmpDir("kit-filter-site"), fixture);
  const html = readFileSync(join(out, "index.html"), "utf8");

  assert.equal((html.match(/components\/filter\.css/g) || []).length, 1, "the stylesheet is linked once");
  assert.match(html, /<link rel="stylesheet" href="\/assets\/css\/components\/filter\.css"[^>]*>/);
  assert.equal((html.match(/\/assets\/js\/filter\.js/g) || []).length, 1, "the script is linked once");
  assert.match(html, /<script src="\/assets\/js\/filter\.js" defer(?:="")?><\/script>/);

  assert.match(html, /<div class="sl-filter" data-filter(?:="")? hidden(?:="")?>/);
  assert.match(html, /<div class="sl-filter" data-filter(?:="")? data-filter-target="#languages" hidden(?:="")?>/);
  assert.match(html, /<input type="search" class="sl-filter-input"[^>]*aria-label="Search"[^>]*data-filter-none="No results"[^>]*data-filter-count="\{n\} results"[^>]*>/);
  assert.match(html, /<p class="sl-filter-status" aria-live="polite"><\/p>/);
});

test("without JavaScript every row and list item shows and none is removed", { skip }, () => {
  const out = buildExample("gem", tmpDir("kit-filter-rows"), fixture);
  const html = readFileSync(join(out, "index.html"), "utf8");

  for (const text of ["Crème brûlée", "Résumé", "A row without accents", "Français", "Español", "English"]) {
    assert.ok(html.includes(text), `the page keeps ${text}`);
  }
  assert.doesNotMatch(html, /<(?:tr|li)[^>]*\bhidden\b/, "no row starts hidden");

  const script = read("assets/js/filter.js");
  assert.match(script, /\.hidden\s*=/, "rows are hidden, not removed");
  assert.doesNotMatch(script, /\.remove\(/);
});
