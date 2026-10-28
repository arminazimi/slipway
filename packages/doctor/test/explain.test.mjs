import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";

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
