import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/checks/twin-fresh.ts";
import { Site } from "../src/site.ts";
import { builtSite } from "../../../tools/fixture-build/build.ts";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);
const docsSite = here("../../../fixtures/docs-site");

test("twin-fresh fires on broken fixture", async () => {
  const site = new Site(fixture("twin-fresh"));
  const { status, findings } = await run(site);

  assert.equal(status, "fail");

  const orphaned = findings.find(f => f.file === "orphaned.twin.html");
  assert.ok(orphaned);
  assert.equal(orphaned.line, 4);

  const missing = findings.find(f => f.file === "missing.md");
  assert.ok(missing);
  assert.equal(missing.line, 1);
});

test("twin-fresh is silent on examples", async () => {
  for (const name of ["bare", "minimal", "docs", "blog", "persian"]) {
    const siteDir = join(repo, "examples", name);
    const site = new Site(siteDir, { build: siteDir });
    const { status, findings } = await run(site);
    assert.equal(status, "pass", `${name} failed with findings: ${JSON.stringify(findings)}`);
    assert.deepEqual(findings, []);
  }
});

/** A manifest for one engine page, as the engine writes it. */
function manifestOf(page) {
  return JSON.stringify({ version: 1, pages: [page] });
}

test("twin-fresh passes on the engine build of fixtures/docs-site", async () => {
  const build = await builtSite("docs-site");
  const site = new Site(docsSite, { build });
  const { status, findings } = await run(site);
  assert.equal(status, "pass", JSON.stringify(findings));
  assert.deepEqual(findings, []);
});

test("twin-fresh reports an engine twin missing from the output", async (t) => {
  const build = mkdtempSync(join(tmpdir(), "slipway-twin-fresh-"));
  t.after(() => rmSync(build, { recursive: true, force: true }));
  const real = JSON.parse(readFileSync(join(await builtSite("docs-site"), ".slipway/manifest.json"), "utf8"));
  const page = real.pages.find((entry) => entry.source === "index.md");
  mkdirSync(join(build, ".slipway"), { recursive: true });
  writeFileSync(join(build, ".slipway/manifest.json"), manifestOf(page));

  const site = new Site(docsSite, { build });
  const { status, findings } = await run(site);
  assert.equal(status, "fail");
  assert.deepEqual(findings.map(({ file, line }) => ({ file, line })), [{ file: "index.md", line: 1 }]);
  assert.match(findings[0].message, /missing its Markdown twin `index.md`/);
});

test("twin-fresh compares an engine source edited after the build with the manifest hash", async (t) => {
  const build = mkdtempSync(join(tmpdir(), "slipway-twin-fresh-"));
  t.after(() => rmSync(build, { recursive: true, force: true }));
  const real = JSON.parse(readFileSync(join(await builtSite("docs-site"), ".slipway/manifest.json"), "utf8"));
  const page = real.pages.find((entry) => entry.source === "index.md");
  mkdirSync(join(build, ".slipway"), { recursive: true });
  writeFileSync(join(build, "index.md"), "an old twin\n");
  writeFileSync(join(build, ".slipway/manifest.json"), manifestOf({ ...page, hashes: { source: "a".repeat(64), html: page.hashes.html } }));

  const site = new Site(docsSite, { build });
  const { status, findings } = await run(site);
  assert.equal(status, "fail");
  assert.deepEqual(findings.map(({ file, line }) => ({ file, line })), [{ file: "index.md", line: 1 }]);
  assert.match(findings[0].message, /changed after the build/);
});

