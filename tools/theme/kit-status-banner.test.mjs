import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";
import { tmpDir } from "./tmp.mjs";

const skip = bundleAvailable() ? false : "run \`bundle install\` to build with the GitHub Pages gem";

test("status banner is rendered on pages and docs", { skip }, () => {
  const out = buildExample("gem", tmpDir("kit-status-banner-site"), join(root, "tools/theme/fixtures/kit-status-banner"));
  const html = readFileSync(join(out, "index.html"), "utf8");

  assert.match(html, /sl-page-status/);
  assert.match(html, /sl-page-status-experimental/);
  assert.match(html, /Experimental/);
});

test("status banner deprecated with since and replaced_by", { skip }, () => {
  const out = buildExample("gem", tmpDir("kit-status-banner-site"), join(root, "tools/theme/fixtures/kit-status-banner"));
  const html = readFileSync(join(out, "deprecated.html"), "utf8");

  assert.match(html, /sl-page-status-deprecated/);
  assert.match(html, /Deprecated/);
  assert.match(html, /Since/);
  assert.match(html, /1\.2\.0/);
  assert.match(html, /Replaced by/);
  assert.match(html, /https:\/\/example\.com\/replacement/);
});
