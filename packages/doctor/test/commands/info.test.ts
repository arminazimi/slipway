import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, cpSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { main, parseArgs } from "../../src/commands/info.ts";

const docsSite = fileURLToPath(new URL("../../../../fixtures/docs-site", import.meta.url));

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

test("info reads an engine site's config, theme pin, and package versions", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-info-engine-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(docsSite, dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({
    devDependencies: { "@velella/mizzen": "0.3.0", "@velella/lateen": "0.3.0" },
  }));

  const ctx = getContext();
  const code = await main(["info", dir, "--format", "json"], ctx);
  assert.equal(code, 0);

  const info = JSON.parse(ctx.stdout);
  assert.equal(info.mode, "engine");
  assert.equal(info.config, "slipway.yml");
  assert.equal(info.themePin, "@velella/lateen@0.3.0");
  assert.equal(info.versions.engine, "0.3.0");
  assert.equal(info.versions.theme, "0.3.0");
  assert.ok(info.versions.node);
  assert.ok(!("ruby" in info.versions), "an engine site does not probe Ruby");
  assert.ok(!("jekyll" in info.versions), "an engine site does not probe Jekyll");
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
