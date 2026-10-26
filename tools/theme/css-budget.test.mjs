import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { budgetBytes, stylesheetSizes, totalBytes } from "./css-budget.mjs";

test("the budget is 30 KB of raw bytes", () => {
  assert.equal(budgetBytes, 30720);
});

test("the stylesheets the theme ships fit the budget", () => {
  const sizes = stylesheetSizes();
  assert.ok(sizes.length >= 2);
  assert.ok(totalBytes(sizes) <= budgetBytes, sizes.map((f) => `${f.name} ${f.bytes}`).join(", "));
});

test("every stylesheet in the folder counts, including ones added later", () => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-css-"));
  writeFileSync(join(dir, "a.css"), "x".repeat(20000));
  writeFileSync(join(dir, "b.css"), "x".repeat(15000));
  writeFileSync(join(dir, "notes.txt"), "x".repeat(9000));
  assert.equal(totalBytes(stylesheetSizes(dir)), 35000);
  assert.ok(totalBytes(stylesheetSizes(dir)) > budgetBytes);
});
