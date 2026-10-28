import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "../theme/tokens.mjs";

test("the resume starter has the expected files", () => {
  const dir = join(root, "starters/resume");
  assert.ok(existsSync(dir), "starters/resume exists");
  assert.ok(existsSync(join(dir, "index.md")), "index.md exists");
  assert.ok(existsSync(join(dir, "_config.yml")), "_config.yml exists");
  assert.ok(existsSync(join(dir, "AGENTS.md")), "AGENTS.md exists");
  assert.ok(existsSync(join(dir, ".vscode/settings.json")), ".vscode/settings.json exists");
  assert.ok(existsSync(join(dir, "fa.md")), "fa.md exists");
  assert.ok(existsSync(join(dir, "_data/resume.yml")), "_data/resume.yml exists");

  const files = readdirSync(dir);
  assert.ok(files.includes("sourcemap.json"), "sourcemap.json");
});
