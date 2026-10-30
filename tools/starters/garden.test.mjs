import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "../theme/tokens.mjs";

test("the garden starter has the expected files", () => {
  const dir = join(root, "starters/garden");
  assert.ok(existsSync(dir), "starters/garden exists");
  assert.ok(existsSync(join(dir, "index.md")), "index.md exists");
  assert.ok(existsSync(join(dir, "garden.md")), "garden.md exists");
  assert.ok(existsSync(join(dir, "_config.yml")), "_config.yml exists");
  assert.ok(existsSync(join(dir, "AGENTS.md")), "AGENTS.md exists");
  assert.ok(existsSync(join(dir, ".vscode/settings.json")), ".vscode/settings.json exists");
  assert.ok(existsSync(join(dir, "_includes/garden-backlinks.html")), "the backlinks include exists");

  const notes = readdirSync(join(dir, "notes")).filter((name) => name.endsWith(".md"));
  assert.ok(notes.length >= 3, "at least three notes");
  for (const note of notes) {
    const text = readFileSync(join(dir, "notes", note), "utf8");
    assert.match(text, /^stage: (seedling|budding|evergreen)$/m, `${note} has a stage`);
    assert.match(text, /^note: [a-z0-9-]+$/m, `${note} has a note key`);
    assert.match(text, /garden-backlinks/, `${note} includes its backlinks`);
  }

  const files = readdirSync(dir);
  assert.ok(!files.includes("sourcemap.json"), "no sourcemap.json");
  assert.ok(!files.some((f) => f.endsWith(".twin.html")), "no twin HTML files");
});
