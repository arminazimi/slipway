import assert from "node:assert/strict";
import { test } from "node:test";
import child_process from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

test("hot files script prints a warning for hot files touched and never fails", async (t) => {
  // Test 1: The script should run and exit with 0.
  const scriptPath = join(process.cwd(), "tools/hot-files/run.mjs");
  const result = child_process.spawnSync("node", [scriptPath], { encoding: "utf8" });
  assert.equal(result.status, 0, "run.mjs should exit with 0");

  // Test 2: We use a temp directory to simulate the workspace.
  // To mock git without running into ESM mocking issues, we'll place a dummy `git` executable in the PATH for a child process.
  const work = mkdtempSync(join(tmpdir(), "slipway-hot-files-"));
  t.after(() => rmSync(work, { recursive: true, force: true }));

  mkdirSync(join(work, ".github"));
  writeFileSync(join(work, ".github/hot-files.txt"), "CHANGELOG.md\npackage.json\n");

  const dummyGitPath = join(work, "git");
  const dummyGitScript = `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === "rev-parse") {
  console.log("abcdef123456");
  process.exit(0);
}
if (args[0] === "diff") {
  console.log("CHANGELOG.md\\nother-file.txt");
  process.exit(0);
}
process.exit(1);
`;
  writeFileSync(dummyGitPath, dummyGitScript);
  chmodSync(dummyGitPath, 0o755);

  const env = { ...process.env, PATH: `${work}:${process.env.PATH}` };

  // Write a small runner script to invoke run.mjs's main function with the temp workspace
  const runnerPath = join(work, "runner.mjs");
  const runnerScript = `
import { main } from ${JSON.stringify(scriptPath)};
main(${JSON.stringify(work)});
`;
  writeFileSync(runnerPath, runnerScript);

  const runnerResult = child_process.spawnSync("node", [runnerPath], { env, encoding: "utf8" });

  assert.equal(runnerResult.status, 0);
  assert.match(runnerResult.stderr, /Warning: This PR edits a hot file: CHANGELOG\.md/);
});
