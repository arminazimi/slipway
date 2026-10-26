import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("Hebrew text has its own font stack", () => {
  assert.match(read("assets/css/slipway.css"), /:lang\(he\) :is\(h1, h2, h3\) \{\s*font-family: var\(--sl-font-hebrew\)/);
  assert.match(read("assets/css/tokens.css"), /--sl-font-hebrew: "Noto Sans Hebrew", "Arial Hebrew"/);
});

test("Hebrew pages read right to left with Hebrew UI strings", { skip }, () => {
  const out = buildExample("gem", join(root, ".tmp-hebrew-site"));
  const page = readFileSync(join(out, "he/post-1/index.html"), "utf8");
  assert.match(page, /<html lang="he" dir="rtl">/);
  assert.match(page, />דילוג לתוכן</);
  assert.match(page, /1 דקות קריאה/);
});
