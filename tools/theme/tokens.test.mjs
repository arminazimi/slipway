import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { staleOutputs } from "./tokens-build.mjs";
import { buildCss, cssVar, listTokens, loadTokens, resolveToken } from "./tokens.mjs";

const tokens = loadTokens();

test("resolveToken returns the palette values for both modes", () => {
  assert.equal(resolveToken(tokens, "color.text", "light"), "#3b3330");
  assert.equal(resolveToken(tokens, "color.text", "dark"), "#b9b2b0");
  assert.equal(resolveToken(tokens, "color.rose", "light"), "#7a4f4f");
  assert.equal(resolveToken(tokens, "color.rose", "dark"), "#b58d90");
  assert.equal(resolveToken(tokens, "color.canvas", "light"), "#e9e1d6");
  assert.equal(resolveToken(tokens, "color.canvas", "dark"), "#262425");
});

test("a component token follows its alias to the semantic value in each mode", () => {
  assert.equal(resolveToken(tokens, "button.bg", "light"), resolveToken(tokens, "color.rose-fill", "light"));
  assert.equal(resolveToken(tokens, "button.bg", "dark"), "#7a5558");
});

test("resolveToken rejects unknown tokens and alias cycles", () => {
  assert.throws(() => resolveToken(tokens, "color.nope", "light"), /unknown token/);
  const loop = { a: { $type: "color", $value: "{b}" }, b: { $type: "color", $value: "{a}" } };
  assert.throws(() => resolveToken(loop, "a", "light"), /cycle/);
});

test("buildCss declares the layers, color-scheme, and light-dark values", () => {
  const css = buildCss(tokens);
  assert.match(css, /@layer reset, tokens, base, components, utilities;/);
  assert.match(css, /color-scheme: light dark;/);
  assert.match(css, /--sl-color-text: light-dark\(#3b3330, #b9b2b0\);/);
  assert.match(css, /:root\[data-theme="dark"\] \{\s+color-scheme: dark;/);
  assert.ok(!css.includes("--sl-primitive"), "primitives are not exposed");
});

test("every token has a description, and variable names are unique", () => {
  const all = listTokens(tokens);
  assert.deepEqual(all.filter((t) => !t.description).map((t) => t.name), []);
  const names = all.map((t) => cssVar(t.name));
  assert.equal(new Set(names).size, names.length);
});

test("staleOutputs flags a hand-edited stylesheet", () => {
  const path = join(mkdtempSync(join(tmpdir(), "slipway-tokens-")), "tokens.css");
  assert.deepEqual(staleOutputs(tokens, path), [path]);
  writeFileSync(path, buildCss(tokens));
  assert.deepEqual(staleOutputs(tokens, path), []);
  writeFileSync(path, `${buildCss(tokens)}/* edited */`);
  assert.deepEqual(staleOutputs(tokens, path), [path]);
});
