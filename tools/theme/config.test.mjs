import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { configMap, renderOverrides } from "./config-map.mjs";
import { validateConfig, validateExampleConfigs } from "./config.mjs";
import { root } from "./tokens.mjs";

const tokens = (value) => ({ slipway: { tokens: value } });

test("a site with no slipway block, or valid overrides, is accepted", () => {
  assert.equal(validateConfig({ title: "x" }).ok, true);
  assert.equal(validateConfig(tokens({ accent: "#8a4f55", radius: "0.5rem", font_display: "Georgia, serif" })).ok, true);
  assert.equal(validateConfig(tokens({ accent: "oklch(55% 0.08 20)" })).ok, true);
});

test("a color that could break out of the style block is rejected", () => {
  for (const accent of ["red;}body{display:none", "#fff</style><script>", "url(x)", "#12345"]) {
    assert.equal(validateConfig(tokens({ accent })).ok, false, accent);
  }
});

test("unknown token keys are rejected with a message", () => {
  const { ok, errors } = validateConfig(tokens({ colour: "#8a4f55" }));
  assert.equal(ok, false);
  assert.match(errors.join("\n"), /additional properties/);
});

test("configMap, the schema, and the Liquid include list the same keys", () => {
  const schema = JSON.parse(readFileSync(join(root, "schema/slipway-config.schema.json"), "utf8"));
  const schemaKeys = Object.keys(schema.properties.slipway.properties.tokens.properties).sort();
  const include = readFileSync(join(root, "_includes/theme-vars.html"), "utf8");
  const includeKeys = [...new Set([...include.matchAll(/value=t\.([a-z_]+)/g)].map((m) => m[1]))].sort();
  assert.deepEqual(Object.keys(configMap).sort(), schemaKeys);
  assert.deepEqual(includeKeys, schemaKeys);
});

test("three overrides restyle the site through three keys (epic exit criterion)", () => {
  const css = renderOverrides({ accent: "#2f6b45", canvas: "#f6f4ec", font_display: "Georgia" });
  assert.deepEqual(css, [
    "--sl-color-rose: #2f6b45;",
    "--sl-color-rose-fill: #2f6b45;",
    "--sl-color-canvas: #f6f4ec;",
    "--sl-font-display: Georgia;",
  ]);
  assert.deepEqual(renderOverrides({}), []);
});

test("validateExampleConfigs reports a bad example config and passes the real ones", () => {
  assert.deepEqual(validateExampleConfigs(), []);
  const dir = mkdtempSync(join(tmpdir(), "slipway-config-"));
  mkdirSync(join(dir, "bad"));
  writeFileSync(join(dir, "bad/_config.yml"), "slipway:\n  tokens:\n    accent: red\n");
  const problems = validateExampleConfigs(dir);
  assert.equal(problems.length > 0, true);
  assert.match(problems[0], /^examples\/bad\/_config\.yml:/);
});

test("the include keeps quotes in font stacks and strips what could end the style block", () => {
  const helper = readFileSync(join(root, "_includes/theme-var.html"), "utf8");
  assert.doesNotMatch(helper, /\|\s*escape/, "escape would turn quotes into &quot; inside <style>");
  assert.doesNotMatch(helper, /\{\{[^}]*"[{}]"/, "a brace inside quotes in {{ }} breaks the Liquid parser");
  for (const char of ["<", ">", "{", "}", ";"]) assert.ok(helper.includes(`remove: "${char}"`), char);
});
