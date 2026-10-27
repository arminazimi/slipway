import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, cpSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main, parseArgs } from "../../src/commands/info.mjs";

function getContext() {
  let stdout = "";
  let stderr = "";
  return {
    log: (msg) => { stdout += msg + "\n"; },
    error: (msg) => { stderr += msg + "\n"; },
    get stdout() { return stdout; },
    get stderr() { return stderr; }
  };
}

test("info --help", async () => {
  const ctx = getContext();
  const code = await main(["info", "--help"], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /Usage: slipway info/);
});

test("info with text format", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-info-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, "_config.yml"), "remote_theme: arminazimi/slipway@v0.2.0\n");

  const ctx = getContext();
  const code = await main(["info", dir], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /Mode: remote/);
  assert.match(ctx.stdout, /Theme pin: arminazimi\/slipway@v0\.2\.0/);
  assert.match(ctx.stdout, /node: v/);
});

test("info with json format", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-info-json-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, "_config.yml"), "theme: slipway-theme\n");

  const ctx = getContext();
  const code = await main(["info", dir, "--format", "json"], ctx);
  assert.equal(code, 0);
  const info = JSON.parse(ctx.stdout);
  assert.equal(info.mode, "gem");
  assert.equal(info.themePin, null);
  assert.ok(info.versions.node);
});

test("info with invalid dir", async () => {
  const ctx = getContext();
  const code = await main(["info", "no/such/folder"], ctx);
  assert.equal(code, 2);
  assert.match(ctx.stderr, /no such folder/);
});

test("parseArgs", () => {
  assert.equal(parseArgs(["info", "x", "--format", "xml"]).error, "--format must be text or json, not xml");
  assert.equal(parseArgs(["info", "x", "--build"]).error, "--build needs a value");
});
