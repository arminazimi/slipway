import assert from "node:assert/strict";
import { test } from "node:test";
import { apca, checkPairs, contrastRatio } from "./contrast.mjs";
import { loadTokens } from "./tokens.mjs";

test("contrastRatio matches known values", () => {
  assert.equal(contrastRatio("#000000", "#ffffff").toFixed(2), "21.00");
  assert.equal(contrastRatio("#ffffff", "#ffffff").toFixed(2), "1.00");
  const text = contrastRatio("#3b3330", "#e9e1d6");
  assert.ok(text > 9.4 && text < 9.6, String(text));
});

test("apca is about 106 for black on white and negative for light on dark", () => {
  assert.ok(Math.abs(apca("#000000", "#ffffff")) > 105 && Math.abs(apca("#000000", "#ffffff")) < 108);
  assert.ok(apca("#ffffff", "#000000") < 0);
});

test("every default text pair passes WCAG AA in light and dark", () => {
  const results = checkPairs(loadTokens());
  assert.equal(results.length, 18);
  assert.deepEqual(results.filter((r) => !r.ok).map((r) => `${r.mode} ${r.pair} ${r.ratio.toFixed(2)}`), []);
});

test("the check can fail: a pale accent is reported", () => {
  const tokens = loadTokens();
  tokens.color.rose.$value = "#d4a29c";
  const failed = checkPairs(tokens).filter((r) => !r.ok);
  assert.ok(failed.some((r) => r.mode === "light" && r.pair.startsWith("color.rose on")));
});

test("every text color token appears in at least one pair", () => {
  const used = new Set(loadTokens().$extensions.slipway.pairs.flatMap(([fg]) => [fg]));
  for (const name of ["color.text", "color.heading", "color.muted", "color.rose", "color.on-rose-fill"]) assert.ok(used.has(name), name);
});
