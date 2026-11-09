import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { root } from "../root.ts";

test("the customization guide describes the engine's customization points", () => {
  const guidePath = join(root, "site/guides/customize.md");
  assert.ok(existsSync(guidePath), "Guide file should exist");

  const content = readFileSync(guidePath, "utf8");
  assert.match(content, /## Logo and footer/i, "Should cover the theme options");
  assert.match(content, /## Navigation/i, "Should cover navigation");
  assert.match(content, /## Changing the theme itself/i, "Should say when a copy of the theme is needed");
  assert.doesNotMatch(content, /## Override slots/i, "0.3 has no override slots");
  assert.doesNotMatch(content, /_config\.yml/i, "The guide describes mizzen.yml, not Jekyll");
});
