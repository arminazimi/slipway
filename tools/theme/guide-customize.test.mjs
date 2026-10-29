import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { root } from "./tokens.mjs";

test("customization guide exists and contains expected sections", () => {
  const guidePath = join(root, "site/guides/customize.md");
  assert.ok(existsSync(guidePath), "Guide file should exist");

  const content = readFileSync(guidePath, "utf8");
  assert.match(content, /## Tokens/i, "Should mention tokens");
  assert.match(content, /## Presets/i, "Should mention presets");
  assert.match(content, /## Override slots/i, "Should mention override slots");
  assert.match(content, /## Custom CSS/i, "Should mention custom CSS");
});
