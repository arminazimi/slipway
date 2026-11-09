import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { testFiles, toolChecks } from "./check.ts";

function tree(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-check-"));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

test("check.mjs finds run.ts and run.mjs tools, and leaves out generators and Jekyll builds", () => {
  const dir = tree({
    "tools/gate/run.ts": "",
    "tools/legacy/run.mjs": "",
    "tools/twins/run.ts": "",
    "tools/old/run.mjs": "// runs: bundle exec jekyll build",
  });
  assert.deepEqual(toolChecks(dir, []), ["tools/gate/run.ts", "tools/legacy/run.mjs"]);
  assert.deepEqual(toolChecks(dir, ["gate"]), ["tools/legacy/run.mjs"]);
});

test("check.mjs finds .test.mjs and .test.ts files, and skips Playwright folders", () => {
  const dir = tree({
    "tools/a.test.mjs": "",
    "tools/gate/run.test.ts": "",
    "tools/ui/playwright.config.js": "",
    "tools/ui/ui.test.mjs": "",
    "packages/engine/test/x.test.ts": "",
  });
  assert.deepEqual(testFiles(dir).sort(), ["packages/engine/test/x.test.ts", "tools/a.test.mjs", "tools/gate/run.test.ts"]);
});

test("the real repository runs the TypeScript-only gate", () => {
  assert.ok(toolChecks().includes("tools/ts-only/run.ts"));
  assert.ok(testFiles().includes("tools/plugins.test.ts"));
});
