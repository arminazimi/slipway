import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";
import { tmpDir } from "./tmp.mjs";

import { validateFrontMatter } from "./front-matter.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("adr and adr-index layouts render correctly", { skip }, () => {
  const out = buildExample("gem", tmpDir("kit-adr-site"), join(root, "tools/theme/fixtures/kit-adr"));

  const index = readFileSync(join(out, "adr/index.html"), "utf8");
  assert.match(index, /sl-adr-index/);

  const adr = readFileSync(join(out, "adr/0001-test.html"), "utf8");
  assert.match(adr, /sl-adr/);
  assert.match(adr, /sl-adr-status-accepted/);
  assert.match(adr, /Alice, Bob/);
  assert.match(adr, /2023-01-01/);
  assert.match(adr, /href="\/adr\/0000-old\.html"/);
  assert.match(adr, /href="\/adr\/0002-new\.html"/);
  assert.match(index, /Accepted/);
  assert.match(index, /href="\/adr\/0001-test\.html"/);
});

test("ADR statuses validate without weakening other page statuses", () => {
  assert.deepEqual(validateFrontMatter({ layout: "adr", title: "Decision", status: "accepted" }), []);
  assert.ok(validateFrontMatter({ layout: "adr", title: "Decision", status: "beta" }).length);
  assert.ok(validateFrontMatter({ layout: "doc", title: "Doc", status: "accepted" }).length);
  assert.ok(validateFrontMatter({ layout: "adr", title: "Decision", status: "accepted", deciders: "Alice" }).length);
});
