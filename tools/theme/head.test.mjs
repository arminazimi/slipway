import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "./tokens.mjs";

test("favicon and touch icon links are conditionally output in head", () => {
  const head = readFileSync(join(root, "_includes/head.html"), "utf8");
  assert.match(head, /site\.slipway\.logo\.favicon_svg/);
  assert.match(head, /site\.slipway\.logo\.touch_icon/);
  assert.match(head, /<link rel="icon"/);
  assert.match(head, /<link rel="apple-touch-icon"/);
});
