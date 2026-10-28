import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";
import { main as explain } from "../src/explain.mjs";

const bin = fileURLToPath(new URL("../bin/slipway.mjs", import.meta.url));
const packageDir = fileURLToPath(new URL("..", import.meta.url));

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

test("cli: --explain says so and exits 2 when docs/checks cannot be read", async () => {
  let stdout = "";
  let stderr = "";
  const code = await explain("ae.agents-md.layout", {
    log: (msg) => { stdout += msg + "\n"; },
    error: (msg) => { stderr += msg + "\n"; },
    docs: fileURLToPath(new URL("./does-not-exist", import.meta.url)),
  });
  assert.equal(code, 2);
  assert.equal(stdout, "");
  assert.match(stderr, /cannot read the check docs at .*does-not-exist/);
});

test("pack: the tarball ships docs/checks, so --explain works from the published package", () => {
  const npmVersion = spawnSync("npm", ["--version"], { encoding: "utf8", shell: process.platform === "win32" });
  if (npmVersion.error || npmVersion.status !== 0) {
    console.log("SKIP: npm is not installed here");
    return;
  }

  const result = spawnSync("npm", ["pack", "--dry-run", "--json"], { cwd: packageDir, encoding: "utf8", shell: process.platform === "win32", maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr);
  const packed = JSON.parse(result.stdout)[0];
  const files = packed.files.map((f) => f.path);

  // The page --explain reads for `ae.agents-md.layout` must be in the tarball.
  assert.ok(files.includes("docs/checks/ae.agents-md.layout.md"), "docs/checks/ae.agents-md.layout.md is not in the tarball");

  // And every check page ships with it.
  const pages = readdirSync(new URL("../docs/checks", import.meta.url)).filter((f) => f.endsWith(".md"));
  for (const page of pages) {
    assert.ok(files.includes(`docs/checks/${page}`), `docs/checks/${page} is not in the tarball`);
  }
});
