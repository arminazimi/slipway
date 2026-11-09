import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import { setToken } from "../src/tools/set_token.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const testDir = join(root, ".tmp/test-set-token");

before(() => {
  rmSync(testDir, { recursive: true, force: true });
  cpSync(join(root, "fixtures/docs-site"), testDir, { recursive: true });
});

after(() => {
  rmSync(testDir, { recursive: true, force: true });
});

test("a token lands under theme.options.tokens in slipway.yml, keeping comments and key order", () => {
  const result = setToken(testDir, { token: "accent", value: "red", file: "slipway.yml" });
  assert.deepEqual(result, { status: "set", file: "slipway.yml", token: "accent", value: "red" });

  const text = readFileSync(join(testDir, "slipway.yml"), "utf8");
  assert.match(text, /theme:\n  options:\n    tokens:\n      accent: red\n/);
  assert.match(text, /^# Fixture config: /, "the leading comment survives");
  assert.match(text, /title: Beacon/, "the existing keys keep their values");
  const order = ["title:", "description:", "url:", "lang:", "navigation:", "repository:", "defaults:", "exclude:", "theme:"];
  const at = order.map((key) => text.indexOf(key));
  assert.deepEqual(at, [...at].sort((a, b) => a - b), "the existing key order survives");
});

test("a second set updates the token in place instead of duplicating it", () => {
  setToken(testDir, { token: "accent", value: "blue", file: "slipway.yml" });
  const text = readFileSync(join(testDir, "slipway.yml"), "utf8");
  assert.match(text, /accent: blue/);
  assert.equal((text.match(/accent:/g) ?? []).length, 1);
  assert.equal((text.match(/tokens:/g) ?? []).length, 1);
});

test("the default file is the engine's mizzen.yml, created in a site that has none", () => {
  const empty = mkdtempSync(join(tmpdir(), "set-token-"));
  try {
    const result = setToken(empty, { token: "canvas", value: "white" });
    assert.equal(result.file, "mizzen.yml");
    assert.equal(readFileSync(join(empty, "mizzen.yml"), "utf8"), "theme:\n  options:\n    tokens:\n      canvas: white\n");
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
});

test("a non-YAML file and a path outside the site are refused", () => {
  assert.throws(() => setToken(testDir, { token: "accent", value: "red", file: "index.md" }), /not a YAML config file/);
  assert.throws(() => setToken(testDir, { token: "accent", value: "red", file: "../slipway.yml" }), /outside the site directory/);
});
