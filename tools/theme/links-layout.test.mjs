import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { buildExample, bundleAvailable } from "./build.mjs";

test("the links layout has the expected content", { skip: !bundleAvailable() ? "requires bundle" : false }, () => {
  const out = buildExample("gem", join(".tmp", "links-site"), "links");
  const html = readFileSync(join(out, "index.html"), "utf8");
  assert.ok(html.includes("sl-links-list"), "has sl-links-list class");
  assert.ok(html.includes("sl-social-icons"), "has sl-social-icons class");
  assert.ok(html.includes("My website"), "has link title");
  assert.ok(html.includes("https://arminazimi.github.io/slipway"), "has link url");
});
