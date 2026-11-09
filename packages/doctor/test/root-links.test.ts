import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { builtSite } from "../../../tools/fixture-build/build.ts";
import { run } from "../src/checks/root-links.ts";
import { Site } from "../src/site.ts";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);
const docsSite = here("../../../fixtures/docs-site");

test("root-links fires on broken fixture", async () => {
  const site = new Site(fixture("root-links"));
  const { status, findings } = await run(site);
  assert.equal(status, "fail");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, "index.md");
  assert.equal(findings[0].line, 2); // [Rules](/rules/) is on line 2
});

test("root-links is silent on examples", async () => {
  for (const name of ["bare", "minimal", "docs", "blog", "persian"]) {
    const siteDir = join(repo, "examples", name);
    const site = new Site(siteDir);
    const { status, findings } = await run(site);
    assert.equal(status, "pass");
    assert.deepEqual(findings, []);
  }
});

test("root-links is silent on the engine build of fixtures/docs-site", async () => {
  const build = await builtSite("docs-site");
  const { status, findings } = await run(new Site(docsSite, { build }));
  assert.equal(status, "pass", JSON.stringify(findings));
  assert.deepEqual(findings, []);
});

test("root-links reads the engine's base and its manifest sources", async (t) => {
  const source = mkdtempSync(join(tmpdir(), "slipway-root-links-"));
  t.after(() => rmSync(source, { recursive: true, force: true }));
  writeFileSync(join(source, "slipway.yml"), "title: Beacon\nbase: /beacon\n");
  writeFileSync(join(source, "guide.md"), "# Guide\n[Rules](/rules/)\n[Good](rules)\n");
  writeFileSync(join(source, "unlisted.md"), "# Unlisted\n[Elsewhere](/elsewhere/)\n");

  // A manifest narrows the check to the pages the build read.
  const build = mkdtempSync(join(tmpdir(), "slipway-root-links-build-"));
  t.after(() => rmSync(build, { recursive: true, force: true }));
  mkdirSync(join(build, ".slipway"), { recursive: true });
  writeFileSync(
    join(build, ".slipway/manifest.json"),
    JSON.stringify({ version: 1, pages: [{ url: "/guide/", source: "guide.md", title: "Guide", layout: null, outputs: [], hashes: {} }] }),
  );

  const { status, findings } = await run(new Site(source, { build }));
  assert.equal(status, "fail");
  assert.deepEqual(findings.map(({ file, line }) => ({ file, line })), [{ file: "guide.md", line: 2 }]);
  assert.match(findings[0].message, /`base`/);
});

