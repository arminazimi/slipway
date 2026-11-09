import test from "node:test";
import assert from "node:assert/strict";
import { judge, parseCoverage, summary } from "./coverage.ts";

const output = `ℹ tests 5
ℹ start of coverage report
ℹ file             | line % | branch % | funcs % | uncovered lines
ℹ flaky.mjs      |  74.60 |    90.48 |   76.92 | 92-94
ℹ all files        |  84.54 |    92.73 |   84.21 | 
ℹ end of coverage report
`;

test("parseCoverage reads the all files line percentage", () => {
  assert.equal(parseCoverage(output), 84.54);
  assert.equal(parseCoverage("no table here"), null);
});

test("judge fails below the floor and passes at or above it", () => {
  assert.equal(judge(84.5, 85).ok, false);
  assert.match(judge(84.5, 85).message, /below the floor/);
  assert.equal(judge(85.2, 85).ok, true);
  assert.equal(judge(null, 85).ok, false);
});

test("judge suggests a higher floor when coverage has risen", () => {
  const verdict = judge(91.3, 85);
  assert.equal(verdict.ok, true);
  assert.match(verdict.message, /raise the floor.*from 85 to 91/);
});

test("summary shows the number, the floor and the table", () => {
  const text = summary(84.54, 85, "a | b");
  assert.match(text, /\*\*84\.54%\*\*/);
  assert.match(text, /floor 85%/);
  assert.match(text, /a \| b/);
});
