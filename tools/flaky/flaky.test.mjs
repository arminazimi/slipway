import test from "node:test";
import assert from "node:assert/strict";
import { findFlaky, parseTap, report, MARKER } from "./flaky.mjs";

const pass = `TAP version 13
# Subtest: steady
ok 1 - steady
  ---
  duration_ms: 0.4
  ...
# Subtest: wobbly
ok 2 - wobbly
  ---
  duration_ms: 0.4
  ...
# Subtest: skipped
ok 3 - skipped # SKIP
1..3
`;

const fail = `TAP version 13
# Subtest: steady
ok 1 - steady
  ---
  duration_ms: 0.4
  ...
# Subtest: wobbly
not ok 2 - wobbly
  ---
  duration_ms: 1.2
  failureType: 'testCodeFailure'
  error: 'timed out after 50ms'
  code: 'ERR_ASSERTION'
  ...
# Subtest: skipped
ok 3 - skipped # SKIP
1..3
`;

const nested = (ok) => `TAP version 13
# Subtest: suite
    # Subtest: inner
    ${ok ? "ok" : "not ok"} 1 - inner
      ---
      ${ok ? "duration_ms: 1" : "error: 'boom'"}
      ...
    1..1
${ok ? "ok" : "not ok"} 1 - suite
1..1
`;

test("parseTap reads results and failure messages and skips SKIP", () => {
  const run = parseTap(fail);
  assert.deepEqual([...run.keys()], ["steady", "wobbly"]);
  assert.deepEqual(run.get("wobbly"), { ok: false, message: "timed out after 50ms" });
});

test("a test that passes in one run and fails in another is flaky", () => {
  const flaky = findFlaky([parseTap(pass), parseTap(fail), parseTap(pass)]);
  assert.deepEqual(flaky, [{ name: "wobbly", passed: 2, failed: 1, messages: ["timed out after 50ms"] }]);
});

test("a test that always fails or always passes is not flaky", () => {
  assert.deepEqual(findFlaky([parseTap(fail), parseTap(fail), parseTap(fail)]), []);
  assert.deepEqual(findFlaky([parseTap(pass), parseTap(pass), parseTap(pass)]), []);
});

test("nested tests are named with their parents", () => {
  const flaky = findFlaky([parseTap(nested(true)), parseTap(nested(false)), parseTap(nested(true))]);
  assert.equal(flaky.length, 1);
  assert.equal(flaky[0].name, "suite > inner");
  assert.deepEqual(flaky[0].messages, ["boom"]);
});

test("report lists each flaky test and is null when there is none", () => {
  assert.equal(report([]), null);
  const body = report([{ file: "a.test.mjs", flaky: findFlaky([parseTap(pass), parseTap(fail), parseTap(pass)]) }]);
  assert.ok(body.startsWith(MARKER));
  assert.match(body, /`a\.test\.mjs`: \*\*wobbly\*\* failed 1 of 3 runs/);
  assert.match(body, /timed out after 50ms/);
});
