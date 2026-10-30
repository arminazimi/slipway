import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { bundleAvailable, buildExample } from "./build.mjs";
import { validateConfig } from "./config.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("every key used in a layout has a built-in English, Persian, Arabic, and Hebrew string", () => {
  const files = ["_layouts/base.html", "_layouts/home.html", "_layouts/doc.html", "_layouts/post.html", "_includes/header.html", "_includes/skip-link.html", "_includes/lang-switcher.html", "_includes/comments.html"];
  const used = new Set(files.flatMap((f) => [...read(f).matchAll(/include t\.html key=['"](\w+)['"]/g)].map((m) => m[1])));
  const fa = read("_includes/i18n/fa.html");
  const ar = read("_includes/i18n/ar.html");
  const he = read("_includes/i18n/he.html");
  const en = read("_includes/i18n/en.html");
  assert.ok(used.size >= 12);
  for (const key of used) {
    assert.ok(fa.includes(`when '${key}'`), `fa: ${key}`);
    assert.ok(ar.includes(`when '${key}'`), `ar: ${key}`);
    assert.ok(he.includes(`when '${key}'`), `he: ${key}`);
    assert.ok(en.includes(`when '${key}'`), `en: ${key}`);
  }
});

test("layouts have no hard-coded language branches left", () => {
  for (const f of ["_layouts/home.html", "_layouts/doc.html", "_layouts/post.html", "_includes/header.html", "_includes/skip-link.html"]) {
    assert.doesNotMatch(read(f), /== 'fa'/, f);
  }
});

test("the languages setting is validated", () => {
  assert.ok(validateConfig({ slipway: { languages: [{ code: "en", name: "English", prefix: "" }, { code: "fa", name: "فارسی", prefix: "/fa" }] } }).ok);
  assert.ok(!validateConfig({ slipway: { languages: [{ code: "en", name: "English" }] } }).ok);
  assert.ok(!validateConfig({ slipway: { languages: [{ code: "en", name: "English", prefix: "fa/" }] } }).ok);
});

test("the example site declares its languages", () => {
  const config = parse(read("examples/minimal/_config.yml"));
  assert.deepEqual(config.slipway.languages.map((l) => l.code), ["en", "fa", "de"]);
});

test("the built site derives dir, translates the chrome, and links the translations", { skip }, () => {
  const out = buildExample("gem", tmpDir("i18n-site"));
  const html = (p) => readFileSync(join(out, p), "utf8");
  const fa = html("fa/index.html");
  assert.match(fa, /<html lang="fa" dir="rtl">/);
  assert.match(fa, /رفتن به محتوا/);
  assert.match(fa, /<a href="\/"[^>]*hreflang="en"/);
  const de = html("de/index.html");
  assert.match(de, /<html lang="de" dir="ltr">/);
  assert.match(de, /Zum Inhalt springen/);
  assert.match(de, /Sprache/);
  assert.match(html("index.html"), /<a href="\/fa\/"[^>]*hreflang="fa"/);
  assert.match(html("index.html"), /Skip to content/);
});

test("every key in the English block has a translation in each new built-in language", () => {
  const enSource = read("_includes/i18n/en.html");
  const keysOf = (block) => [...block.matchAll(/{%- when '([^']+)' -%}/g)].map((m) => m[1]);
  const english = keysOf(enSource);
  for (const lang of ["es", "fr", "pt", "de", "it", "ru", "tr", "nl", "ja", "zh", "ur", "ckb", "yi", "ps", "el", "az", "hu", "nb", "th", "ta", "uk", "ro", "sw", "hi", "id", "ko", "ms", "bn", "vi", "cs", "da"]) {
    const block = read(`_includes/i18n/${lang}.html`);
    assert.deepEqual(keysOf(block), english, `${lang} has every key`);
  }
});
