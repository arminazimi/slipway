import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("Urdu pages get RTL direction, Urdu lang, and Urdu UI strings", { skip }, () => {
  const out = buildExample("gem", tmpDir("lang-ur"), join(root, "tools/theme/fixtures/lang-ur"));
  const page = readFileSync(join(out, "2027/01/01/post.html"), "utf8");

  assert.match(page, /<html lang="ur" dir="rtl">/);

  // Check translation string
  assert.match(page, /مواد پر جائیں/); // skip to content

  // Verify no left over English keys
  assert.doesNotMatch(page, /Skip to content/);
});
