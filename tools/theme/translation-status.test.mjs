import assert from "node:assert/strict";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { after, test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

after(() => {
  rmSync(join(root, "examples/minimal/status.md"), { force: true });
});

test("translation status page renders table of translation keys and languages", { skip }, () => {
  const dir = join(root, ".tmp-status-site");
  writeFileSync(join(root, "examples/minimal/status.md"), "---\nlayout: translation-status\ntitle: Status\n---\n");
  const out = buildExample("gem", dir, "minimal");
  const html = readFileSync(join(out, "status.html"), "utf8");
  assert.match(html, /<th>English<\/th>/);
  assert.match(html, /<th>فارسی<\/th>/);
});
