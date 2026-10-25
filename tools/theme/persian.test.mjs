import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { validateConfig } from "./config.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("the persian setting accepts digits and jalali and nothing else", () => {
  assert.ok(validateConfig({ slipway: { persian: { digits: true, jalali: false } } }).ok);
  assert.ok(!validateConfig({ slipway: { persian: { digits: "yes" } } }).ok);
  assert.ok(!validateConfig({ slipway: { persian: { calendar: "jalali" } } }).ok);
});

test("Persian text has taller lines, no italics, and Persian section numbers behind the opt-in class", () => {
  const css = read("assets/css/slipway.css");
  const fa = css.slice(css.indexOf("Persian and Arabic: taller lines"));
  assert.match(fa, /line-height: 1\.9/);
  assert.match(fa, /font-style: normal/);
  assert.match(fa, /\.sl-fa-digits \.sl-sections > h2::before/);
  assert.match(read("_layouts/base.html"), /site\.slipway\.persian\.digits/);
});

test("Jalali dates are right at the edges of a year, with Persian digits", { skip }, () => {
  const out = buildExample("gem", join(root, ".tmp-persian-site"));
  const time = (n) => readFileSync(join(out, `fa/post-${n}/index.html`), "utf8").match(/<time[^>]*>([^<]*)<\/time>/)[1];
  assert.equal(time(1), "۲۹ اسفند ۱۴۰۴");
  assert.equal(time(2), "۱ فروردین ۱۴۰۵");
  assert.equal(time(3), "۳۰ مهر ۱۴۰۵");
  const page = readFileSync(join(out, "fa/post-1/index.html"), "utf8");
  assert.match(page, /<body class="sl-fa-digits"/);
  assert.match(page, /۱ دقیقه مطالعه/);
});

test("English pages keep Gregorian dates and Latin digits", { skip }, () => {
  const out = buildExample("gem", join(root, ".tmp-persian-site"));
  const post = readFileSync(join(out, "2026/10/18/hello-world.html"), "utf8");
  assert.match(post, /<time[^>]*>2026-10-18<\/time>/);
  assert.match(post, /1 min read/);
  assert.doesNotMatch(post, /sl-fa-digits/);
});
