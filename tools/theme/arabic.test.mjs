import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { validateConfig } from "./config.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("the arabic setting accepts digits and nothing else", () => {
  assert.ok(validateConfig({ slipway: { arabic: { digits: true } } }).ok);
  assert.ok(!validateConfig({ slipway: { arabic: { digits: "yes" } } }).ok);
  assert.ok(!validateConfig({ slipway: { arabic: { hijri: true } } }).ok);
});

test("Arabic text has its own font stack, taller lines, no italics, and Arabic-Indic section numbers behind the opt-in class", () => {
  const css = read("assets/css/slipway.css");
  assert.match(css, /:lang\(ar\) :is\(h1, h2, h3\) \{\s*font-family: var\(--sl-font-arabic\)/);
  assert.match(read("assets/css/tokens.css"), /--sl-font-arabic: Vazirmatn, "Source Serif 4"/);
  const rtl = css.slice(css.indexOf("Persian and Arabic: taller lines"));
  assert.match(rtl, /:is\(:lang\(fa\), :lang\(ar\)\) body/);
  assert.match(rtl, /system: extends arabic-indic;\s*pad: 2 "٠"/);
  assert.match(rtl, /\.sl-ar-digits \.sl-sections > h2::before \{\s*content: counter\(sl-section, sl-arabic-padded\)/);
  assert.match(read("_layouts/base.html"), /site\.slipway\.arabic\.digits %\} class="sl-ar-digits"/);
});

test("Arabic pages get Arabic-Indic digits and Arabic UI strings", { skip }, () => {
  const out = buildExample("gem", join(root, ".tmp-arabic-site"));
  const page = readFileSync(join(out, "ar/post-1/index.html"), "utf8");
  assert.match(page, /<html lang="ar" dir="rtl">/);
  assert.match(page, /<body class="sl-ar-digits"/);
  assert.match(page, /<time[^>]*>٢٠٢٦-١٠-٢٣<\/time>/);
  assert.match(page, /١ دقيقة قراءة/);
  assert.match(page, />انتقال إلى المحتوى</);
});
