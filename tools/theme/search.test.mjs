import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import vm from "node:vm";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

function load() {
  const context = { document: undefined };
  context.globalThis = context;
  vm.runInNewContext(read("assets/js/search.js"), context);
  const { normalize, search } = context.slipwaySearch;
  // Copy results into this realm so deepEqual compares plain arrays.
  return { normalize, search: (...args) => Array.from(search(...args)) };
}

const index = [
  { title: "Layouts", url: "/docs/layouts/", description: "The layouts Slipway ships.", text: "Base and home layouts hold the landmarks." },
  { title: "Tokens", url: "/docs/tokens/", description: "The design tokens.", text: "Colors come from tokens. A layout can restyle them." },
  { title: "می‌خواهم", url: "/fa/a/", description: "", text: "نوشته‌ای با ي و ك عربی و عدد ۱۲۳" },
];

test("normalize unifies Arabic and Persian letters, drops ZWNJ, ZWJ, and diacritics, and uses Latin digits", () => {
  const { normalize } = load();
  assert.equal(normalize("كيف"), "کیف");
  assert.equal(normalize("ڪتاب"), "کتاب");
  assert.equal(normalize("می‌خواهم"), "میخواهم");
  assert.equal(normalize("پائیز"), "پاییز");
  assert.equal(normalize("عیسیٰ"), "عیسی");
  assert.equal(normalize("مُطْمَئِنّ"), "مطمین");
  assert.equal(normalize("۱۲۳ ٤٥٦"), "123 456");
  assert.equal(normalize("سَلام"), "سلام");
  assert.equal(normalize("Layouts"), "layouts");
});

test("every word must match, and titles rank above text", () => {
  const { search } = load();
  assert.deepEqual(search(index, "layout").map((r) => r.title), ["Layouts", "Tokens"]);
  assert.deepEqual(search(index, "colors layout").map((r) => r.title), ["Tokens"]);
  assert.deepEqual(search(index, "nothing here"), []);
  assert.deepEqual(search(index, "   "), []);
});

test("Persian queries match across ي/ی, ك/ک, ZWNJ, and digit sets", () => {
  const { search } = load();
  assert.equal(search(index, "میخواهم")[0].title, "می‌خواهم");
  assert.equal(search(index, "کیف").length, 0);
  assert.equal(search(index, "عربي")[0].title, "می‌خواهم");
  assert.equal(search(index, "123")[0].title, "می‌خواهم");
  assert.equal(search(index, "مِى‌خْوَاهَم")[0].title, "می‌خواهم");
});

test("the script is small and the field is hidden until it runs", () => {
  assert.ok(Buffer.byteLength(read("assets/js/search.js")) < 5120);
  assert.match(read("_includes/search.html"), /data-search=.*hidden>/s);
  assert.match(read("_includes/head.html"), /search\.js' \| relative_url \}\}" defer/);
});

test("the search styles use logical properties only", () => {
  const css = read("assets/css/slipway.css");
  assert.doesNotMatch(css.slice(css.indexOf("Search: a field")), /\b(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/);
});

test("each language has an index with only its own pages, and never lists itself", { skip }, () => {
  const out = buildExample("gem", tmpDir("search-site"));
  const get = (p) => JSON.parse(readFileSync(join(out, p), "utf8"));
  const en = get("search.json");
  const fa = get("fa/search.json");
  assert.ok(en.some((e) => e.url === "/docs/layouts/" && e.title === "Layouts"));
  assert.ok(!en.some((e) => e.url.endsWith("search.json") || e.url.startsWith("/fa/")));
  assert.ok(fa.length >= 4 && fa.every((e) => e.url.startsWith("/fa/")));
  assert.ok(fa.every((e) => typeof e.text === "string" && e.text.length <= 603));
  const page = readFileSync(join(out, "fa/index.html"), "utf8");
  assert.match(page, /data-search="\/fa\/search\.json"/);
  assert.match(page, /جست‌وجو/);
});
