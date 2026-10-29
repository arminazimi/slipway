import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("Sindhi pages get RTL direction, Sindhi lang, and Sindhi UI strings", { skip }, () => {
  const out = buildExample("gem", tmpDir("lang-sd"), join(root, "tools/theme/fixtures/lang-sd"));
  const page = readFileSync(join(out, "2027/01/01/post.html"), "utf8");

  assert.match(page, /<html lang="sd" dir="rtl">/);

  // Assert translation string exists (e.g. skip to content translation)
  assert.match(page, /مواد ڏانهن وڃو/);

  // Assert no leftover English UI strings (from en.html)
  assert.doesNotMatch(page, /Skip to content/);
});
