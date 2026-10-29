import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("Dhivehi pages get RTL direction, dv lang, and Dhivehi UI strings", { skip }, () => {
  const out = buildExample("gem", tmpDir("lang-dv"), join(root, "tools/theme/fixtures/lang-dv"));
  const page = readFileSync(join(out, "2027/01/01/post.html"), "utf8");

  assert.match(page, /<html lang="dv" dir="rtl">/);

  // Check translation string for "Skip to content"
  assert.match(page, /ކޮންޓެންޓަށް ދާށެވެ/);

  // Verify no left over English keys for translated words
  assert.doesNotMatch(page, /Skip to content/);
});
