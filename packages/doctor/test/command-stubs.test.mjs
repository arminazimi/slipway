import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main, parseArgs } from "../src/commands/stubs.mjs";
import { stubs, siteFiles } from "../src/checks/jekyll.mjs";

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

test("stubs --help", async () => {
  const ctx = getContext();
  const code = await main(["stubs", "--help"], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /Usage: slipway stubs/);
});

test("stubs parseArgs errors", () => {
  assert.equal(parseArgs(["stubs"]).error, "missing <source-dir>");
  assert.equal(parseArgs(["stubs", "dir", "--unknown"]).error, "unknown option: --unknown");
});

test("stubs copies missing files", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-stubs-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const ctx = getContext();
  const code = await main(["stubs", dir], ctx);
  assert.equal(code, 0);

  // Since it creates files, verify that at least one of the stubs is now there
  const requiredStubs = stubs.filter(s => !siteFiles.includes(s));
  assert.ok(requiredStubs.length > 0);
  assert.ok(existsSync(join(dir, requiredStubs[0])));
  assert.match(ctx.stdout, new RegExp(`copied ${requiredStubs[0]}`));
});

test("stubs --check lists missing files and returns 1", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-stubs-check-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const ctx = getContext();
  const code = await main(["stubs", dir, "--check"], ctx);
  assert.equal(code, 1);
  assert.match(ctx.stdout, /missing:/);

  // the directory should remain empty
  const requiredStubs = stubs.filter(s => !siteFiles.includes(s));
  assert.ok(!existsSync(join(dir, requiredStubs[0])));
});

test("stubs --json without --check returns JSON with copied files", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-stubs-json-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const ctx = getContext();
  const code = await main(["stubs", dir, "--json"], ctx);
  assert.equal(code, 0);
  const out = JSON.parse(ctx.stdout);
  assert.ok(out.copied);
  assert.ok(Array.isArray(out.copied));
  assert.ok(out.copied.length > 0);
});

test("stubs --check --json returns JSON with missing and stale arrays", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-stubs-jsoncheck-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  // Create one stale file
  const requiredStubs = stubs.filter(s => !siteFiles.includes(s));
  assert.ok(requiredStubs.length > 1);
  const staleStub = requiredStubs[0];
  const destDir = join(dir, staleStub.split('/')[0]);
  if (!existsSync(destDir) && staleStub.includes('/')) mkdirSync(destDir, { recursive: true });
  writeFileSync(join(dir, staleStub), "old content");

  const ctx = getContext();
  const code = await main(["stubs", dir, "--check", "--json"], ctx);
  assert.equal(code, 1);
  const out = JSON.parse(ctx.stdout);
  assert.ok(out.missing);
  assert.ok(out.stale);
  assert.ok(out.stale.includes(staleStub));
  assert.ok(out.missing.includes(requiredStubs[1]));
});
