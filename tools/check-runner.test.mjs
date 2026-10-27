import assert from "node:assert/strict";
import { test } from "node:test";
import { testFiles, toolChecks } from "./check.mjs";

test("check.mjs finds the browser tools but not the generators, and no Playwright test files", () => {
  const tools = toolChecks();
  for (const name of ["a11y", "browser", "nojs", "screenshots"]) assert.ok(tools.includes(`tools/${name}/run.mjs`), name);
  for (const name of ["sourcemap", "twins", "html-validate"]) assert.ok(!tools.includes(`tools/${name}/run.mjs`), name);
  const tests = testFiles();
  assert.ok(tests.includes("tools/release/prepare.test.mjs") && tests.includes("tools/plugins.test.mjs"));
  assert.ok(!tests.some((f) => /^tools\/(a11y|browser|nojs|screenshots)\//.test(f)));
});
