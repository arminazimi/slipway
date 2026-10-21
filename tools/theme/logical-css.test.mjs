import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { findPhysical, themeStylesheets } from "./logical-css.mjs";

test("the lint flags physical properties", () => {
  const css = ["a { margin-left: 1rem; }", "b { text-align: right; }", "c { left: 0; }", "d { float: left; }", "e { width: 10rem; }", "f { border-top-left-radius: 4px; }"].join("\n");
  assert.equal(findPhysical(css).length, 6);
});

test("the lint accepts logical properties, line-height, comments, and media queries", () => {
  const css = ["a { margin-inline-start: 1rem; inset-inline-end: 0; text-align: end; line-height: 1.5; max-inline-size: 40rem; }", "/* margin-left: 0 */", "@media (min-width: 64rem) {", "}"].join("\n");
  assert.deepEqual(findPhysical(css), []);
});

test("every theme stylesheet uses logical properties only", () => {
  const files = themeStylesheets();
  assert.ok(files.length >= 4);
  for (const file of files) assert.deepEqual(findPhysical(readFileSync(file, "utf8"), file), []);
});
