import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, cpSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { main, parseArgs } from "../src/commands/pin.ts";

const docsSite = fileURLToPath(new URL("../../../fixtures/docs-site", import.meta.url));

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

test("pin error case with no engine config", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-pin-err-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const ctx = getContext();
  const code = await main(["pin", "v0.2.0", dir], ctx);
  assert.equal(code, 1);
  assert.match(ctx.stderr, /no engine config/);
});

test("pin ignores a Jekyll _config.yml: only an engine site can be pinned", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-pin-err2-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, "_config.yml"), "remote_theme: arminazimi/slipway@v0.1.0\n");

  const ctx = getContext();
  const code = await main(["pin", "v0.2.0", dir], ctx);
  assert.equal(code, 1);
  assert.match(ctx.stderr, /no engine config/);
  assert.match(readFileSync(join(dir, "_config.yml"), "utf8"), /v0\.1\.0/);
});

test("pin updates the engine and theme npm versions on an engine site", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-pin-engine-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(docsSite, dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({
    devDependencies: { "@velella/mizzen": "0.2.0", "@velella/lateen": "0.2.0" },
  }, null, 2));

  const ctx = getContext();
  const code = await main(["pin", "0.3.0", dir, "--json"], ctx);
  assert.equal(code, 0);

  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  assert.equal(manifest.devDependencies["@velella/mizzen"], "0.3.0");
  assert.equal(manifest.devDependencies["@velella/lateen"], "0.3.0");

  const out = JSON.parse(ctx.stdout);
  assert.equal(out.oldVersion, "0.2.0");
  assert.equal(out.newVersion, "0.3.0");
  assert.deepEqual(out.packages, [
    { name: "@velella/mizzen", from: "0.2.0", to: "0.3.0" },
    { name: "@velella/lateen", from: "0.2.0", to: "0.3.0" },
  ]);
});

test("pin follows theme.name on an engine site", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-pin-theme-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(docsSite, dir, { recursive: true });
  writeFileSync(join(dir, "slipway.yml"), `${readFileSync(join(dir, "slipway.yml"), "utf8")}\ntheme:\n  name: "@example/docs-theme"\n`);
  writeFileSync(join(dir, "package.json"), JSON.stringify({
    dependencies: { "@example/docs-theme": "1.0.0" },
  }));

  const ctx = getContext();
  const code = await main(["pin", "1.1.0", dir], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /Updated @example\/docs-theme from 1\.0\.0 to 1\.1\.0/);

  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  assert.equal(manifest.dependencies["@example/docs-theme"], "1.1.0");
});

test("pin creates package.json and adds the engine and theme pins on an engine site", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-pin-engine-new-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(docsSite, dir, { recursive: true });

  const ctx = getContext();
  const code = await main(["pin", "0.3.0", dir], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /Pinned @velella\/mizzen at 0\.3\.0/);
  assert.match(ctx.stdout, /Pinned @velella\/lateen at 0\.3\.0/);

  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  assert.equal(manifest.devDependencies["@velella/mizzen"], "0.3.0");
  assert.equal(manifest.devDependencies["@velella/lateen"], "0.3.0");
});

test("parseArgs", () => {
  assert.equal(parseArgs(["pin", "v0.2.0", "x", "--format", "xml"]).error, "unknown option: --format");
  assert.equal(parseArgs(["pin"]).error, "missing <version>");
});
