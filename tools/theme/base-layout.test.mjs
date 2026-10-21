import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");

test("base layout has the landmarks: banner, one main target, contentinfo", () => {
  const base = read("_layouts/base.html");
  assert.match(base, /include header\.html/);
  assert.match(base, /<main id="main"/);
  assert.match(base, /include footer\.html/);
  assert.ok(read("_includes/header.html").includes("<header"));
  assert.ok(read("_includes/footer.html").includes("<footer"));
});

test("the skip link is the first thing in body and points at main", () => {
  const base = read("_layouts/base.html");
  assert.ok(base.indexOf("skip-link.html") < base.indexOf("header.html"));
  assert.match(read("_includes/skip-link.html"), /href="#main"/);
});

test("the skip link stays out of view until it has focus, using logical properties", () => {
  const css = read("assets/css/slipway.css");
  assert.match(css, /\.sl-skip-link:focus/);
  assert.doesNotMatch(css, /\.sl-(skip-link|header|footer|site-title)[^}]*\b(left|right|margin-left|margin-right)\s*:/);
});

test("the default layout inherits from base so existing sites keep working", () => {
  assert.match(read("_layouts/default.html"), /layout: base/);
});

test("the theme toggle sits in the header and the site title links home", () => {
  const header = read("_includes/header.html");
  assert.match(header, /data-theme-toggle/);
  assert.ok(header.indexOf("sl-site-title") < header.indexOf("data-theme-toggle"));
});
