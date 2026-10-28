import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";
import { tmpDir } from "./tmp.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("terminal block renders commands and output", { skip }, () => {
  const out = buildExample("gem", tmpDir("kit-terminal-site"), join(root, "tools/theme/fixtures/kit-terminal"));
  const html = readFileSync(join(out, "index.html"), "utf8");
  assert.match(html, /sl-terminal/);
  assert.match(html, /npm install/);
  assert.match(html, /Added 123 packages/);
});
