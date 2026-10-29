import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("Uyghur pages get RTL direction, ug lang, and Uyghur UI strings", { skip }, () => {
  const out = buildExample("gem", tmpDir("lang-ug"), join(root, "tools/theme/fixtures/lang-ug"));
  const page = readFileSync(join(out, "2027/01/01/post.html"), "utf8");

  assert.match(page, /<html lang="ug" dir="rtl">/);

  // Check translation string
  assert.match(page, /مەزمۇنغا ئاتلاش/); // skip to content

  // Verify no left over English keys (except the ones we left as TODO)
  assert.doesNotMatch(page, /Skip to content/);
});
