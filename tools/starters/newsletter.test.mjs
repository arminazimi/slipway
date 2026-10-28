import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "../theme/tokens.mjs";

test("the newsletter starter has the expected files", () => {
  const dir = join(root, "starters/newsletter");
  assert.ok(existsSync(dir), "starters/newsletter exists");
  assert.ok(existsSync(join(dir, "index.md")), "index.md exists");
  assert.ok(existsSync(join(dir, "_config.yml")), "_config.yml exists");
  assert.ok(existsSync(join(dir, "AGENTS.md")), "AGENTS.md exists");
  assert.ok(existsSync(join(dir, ".vscode/settings.json")), ".vscode/settings.json exists");

  const files = readdirSync(dir);
  assert.ok(!files.includes("sourcemap.json"), "no sourcemap.json");
  assert.ok(!files.some(f => f.endsWith(".twin.html")), "no twin HTML files");
});
