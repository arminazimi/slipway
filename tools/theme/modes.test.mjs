import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const remote = process.env.SLIPWAY_TEST_REMOTE ? false : "set SLIPWAY_TEST_REMOTE=1 (needs network and a pushed theme)";

function assertSite(out) {
  const en = readFileSync(join(out, "index.html"), "utf8");
  assert.match(en, /<html lang="en" dir="ltr">/);
  assert.match(en, /<title>Hello Slipway<\/title>/);
  assert.match(en, /<link rel="stylesheet" href="[^"]*\/assets\/css\/slipway\.css">/);
  assert.ok(existsSync(join(out, "assets/css/slipway.css")), "theme stylesheet is in the built site");

  const fa = readFileSync(join(out, "fa/index.html"), "utf8");
  assert.match(fa, /<html lang="fa" dir="rtl">/);
}

const out = (mode) => join(mkdtempSync(join(tmpdir(), `slipway-${mode}-`)), "_site");

test("gem mode: the layout comes from the theme gem", { skip }, () => {
  assertSite(buildExample("gem", out("gem")));
});

test("template mode: the layout comes from the site itself", { skip }, () => {
  assertSite(buildExample("template", out("template")));
});

test("remote_theme mode: the layout comes from GitHub", { skip: skip || remote }, () => {
  assertSite(buildExample("remote", out("remote")));
});
