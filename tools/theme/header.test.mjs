import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { validateConfig } from "./config.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const work = mkdtempSync(join(tmpdir(), "slipway-header-"));
after(() => rmSync(work, { recursive: true, force: true }));

/** The opening tag and contents of the site header in a built page. */
const header = (html) => html.slice(html.indexOf("<header"), html.indexOf("</header>"));

test("slipway.header accepts classic, centered, and minimal and nothing else", () => {
  for (const header of ["classic", "centered", "minimal"]) assert.ok(validateConfig({ slipway: { header } }).ok, header);
  assert.ok(!validateConfig({ slipway: { header: "split" } }).ok);
  assert.ok(!validateConfig({ slipway: { header: true } }).ok);
});

test("each variant has its styles, written with logical properties", () => {
  const css = read("assets/css/slipway.css");
  assert.match(css, /\.sl-header-centered \{[^}]*flex-direction: column/);
  assert.match(css, /\.sl-header-centered \.sl-main-nav ul \{[^}]*justify-content: center/);
  assert.match(css, /\.sl-header-minimal \.sl-site-title \{[^}]*margin-inline-end: auto/);
  assert.doesNotMatch(css, /\.sl-header-[a-z]+[^{]*\{[^}]*\b(left|right|margin-left|margin-right)\s*:/);
});

test("a site without slipway.header keeps the classic header", { skip }, () => {
  const page = header(readFileSync(join(buildExample("gem", join(work, "docs"), "docs"), "index.html"), "utf8"));
  assert.match(page, /<header class="sl-header">/);
  assert.match(page, /sl-main-nav/);
  assert.match(page, /sl-search/);
});

test("centered: the blog example renders the centered header with its navigation", { skip }, () => {
  const page = header(readFileSync(join(buildExample("gem", join(work, "blog"), "blog"), "index.html"), "utf8"));
  assert.match(page, /<header class="sl-header sl-header-centered">/);
  assert.match(page, /sl-main-nav/);
  assert.match(page, /sl-site-title/);
  assert.match(page, /data-theme-toggle/);
});

test("minimal: only the title, the language switcher, and the theme toggle", { skip }, () => {
  const site = join(work, "minimal-src");
  cpSync(join(root, "examples/minimal"), site, { recursive: true });
  const config = readFileSync(join(site, "_config.yml"), "utf8");
  writeFileSync(join(site, "_config.yml"), config.replace(/^slipway:\n/m, "slipway:\n  header: minimal\n"));
  const page = header(readFileSync(join(buildExample("gem", join(work, "minimal"), site), "index.html"), "utf8"));
  assert.match(page, /<header class="sl-header sl-header-minimal">/);
  assert.match(page, /sl-site-title/);
  assert.match(page, /sl-lang/);
  assert.match(page, /data-theme-toggle/);
  assert.doesNotMatch(page, /sl-main-nav/);
  assert.doesNotMatch(page, /sl-search/);
});
