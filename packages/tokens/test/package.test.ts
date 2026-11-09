import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const dir = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(dir, "dist");

test("built package contains expected files", () => {
  assert.ok(existsSync(join(dist, "theme.tokens.json")), "theme.tokens.json should exist");
  assert.ok(existsSync(join(dist, "tokens.css")), "tokens.css should exist");
  assert.ok(existsSync(join(dist, "slipway.css")), "slipway.css should exist");
  assert.ok(existsSync(join(dist, "fonts.css")), "fonts.css should exist");
  assert.ok(existsSync(join(dist, "print.css")), "print.css should exist");
});

test("built package exports are configured correctly", () => {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  assert.equal(pkg.name, "@slipway/tokens");
  assert.equal(pkg.exports["./theme.tokens.json"], "./dist/theme.tokens.json");
  assert.equal(pkg.exports["./tokens.css"], "./dist/tokens.css");
  assert.equal(pkg.exports["./slipway.css"], "./dist/slipway.css");
  assert.equal(pkg.exports["./fonts.css"], "./dist/fonts.css");
  assert.equal(pkg.exports["./print.css"], "./dist/print.css");
});
