import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readdirSync, renameSync, existsSync } from "node:fs";

const bin = fileURLToPath(new URL("../bin/slipway.mjs", import.meta.url));

test("cli: --explain prints a check's page", () => {
  const result = spawnSync(process.execPath, [bin, "doctor", "--explain", "ae.agents-md.layout"], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^# ae\.agents-md\.layout\n/);
});

test("cli: --explain alone lists every ID", () => {
  const result = spawnSync(process.execPath, [bin, "doctor", "--explain"], { encoding: "utf8" });
  assert.equal(result.status, 0);

  const checksDir = fileURLToPath(new URL("../src/checks", import.meta.url));
  const ids = readdirSync(checksDir).filter(f => f.startsWith("ae.") && f.endsWith(".mjs")).map(f => f.replace(".mjs", ""));

  for (const id of ids) {
    assert.match(result.stdout, new RegExp(id.replace(/\\./g, '\\\\.')));
  }
});

test("cli: --explain unknown ID gives exit code 2 and lists closest", () => {
  const result = spawnSync(process.execPath, [bin, "doctor", "--explain", "ae.agent-md.layout"], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown check ID: ae\.agent-md\.layout/);
  assert.match(result.stderr, /Did you mean:\n\s+ae\.agents-md\.layout/);
});

test("cli: npm pack output includes docs/checks pages", () => {
  const doctorDir = fileURLToPath(new URL("..", import.meta.url));
  const result = spawnSync("npm", ["pack", "--dry-run", "--json"], { encoding: "utf8", cwd: doctorDir });
  if (result.error && result.error.code === 'ENOENT') {
    console.log("SKIP: npm is not installed here");
    return;
  }
  assert.equal(result.status, 0);
  const out = JSON.parse(result.stdout);
  const files = out[0].files.map(f => f.path);
  assert.ok(files.includes("docs/checks/ae.agents-md.layout.md"));
});

test("cli: --explain errors cleanly when docs/checks cannot be read", () => {
  // We mock a situation where docs/checks is unreadable by mocking readdirSync?
  // No, actually wait, the prompt says "New test asserts the clear error: exit 2 and no stdout when docs/checks cannot be read (reproduces the bug path)."
  // We can rename docs to docs-hidden temporarily and run the cli.


  const docsDir = fileURLToPath(new URL("../docs", import.meta.url));
  const hiddenDocsDir = fileURLToPath(new URL("../docs-hidden", import.meta.url));

  try {
    renameSync(docsDir, hiddenDocsDir);
    const result = spawnSync(process.execPath, [bin, "doctor", "--explain"], { encoding: "utf8" });
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /slipway: cannot read the check docs at .*docs\/checks:/);
  } finally {
    if (existsSync(hiddenDocsDir)) renameSync(hiddenDocsDir, docsDir);
  }
});
