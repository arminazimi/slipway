import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main, parseArgs } from "../src/commands/pin.mjs";

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

test("pin --help", async () => {
  const ctx = getContext();
  const code = await main(["pin", "--help"], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /Usage: slipway pin/);
});

test("pin <version> with text format updates config", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-pin-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, "_config.yml"), "title: Test\nremote_theme: arminazimi/slipway@v0.1.0\nplugins: []\n");

  const ctx = getContext();
  const code = await main(["pin", "v0.2.0", dir], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /Updated remote_theme from v0\.1\.0 to v0\.2\.0/);
});

test("pin <version> --json format", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-pin-json-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, "_config.yml"), "remote_theme: arminazimi/slipway@v0.1.0\n");

  const ctx = getContext();
  const code = await main(["pin", "v0.2.0", dir, "--json"], ctx);
  assert.equal(code, 0);

  const info = JSON.parse(ctx.stdout);
  assert.equal(info.oldVersion, "v0.1.0");
  assert.equal(info.newVersion, "v0.2.0");
});

test("pin error case with missing config", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-pin-err-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const ctx = getContext();
  const code = await main(["pin", "v0.2.0", dir], ctx);
  assert.equal(code, 1);
  assert.match(ctx.stderr, /no _config\.yml found/);
});

test("pin error case with missing remote_theme", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-pin-err2-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, "_config.yml"), "theme: slipway-theme\n");

  const ctx = getContext();
  const code = await main(["pin", "v0.2.0", dir], ctx);
  assert.equal(code, 1);
  assert.match(ctx.stderr, /no remote_theme pin found in _config\.yml/);
});

test("parseArgs", () => {
  assert.equal(parseArgs(["pin", "v0.2.0", "x", "--format", "xml"]).error, "unknown option: --format");
  assert.equal(parseArgs(["pin"]).error, "missing <version>");
});
