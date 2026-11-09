import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { detect } from "../src/detect.ts";
import { doctor } from "../src/doctor.ts";
import { Site } from "../src/site.ts";

const docsSite = fileURLToPath(new URL("../../../fixtures/docs-site", import.meta.url));

/** An empty temporary folder, removed after the test. */
function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-engine-site-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const page = (url, source) => ({
  url,
  source,
  title: source,
  layout: null,
  outputs: [`${source.replace(/\.md$/, "")}/index.html`],
  hashes: { source: "a".repeat(64), html: "b".repeat(64) },
});

test("the engine is detected from mizzen.yml or the pre-renaming slipway.yml", (t) => {
  const dir = tempDir(t);
  for (const name of ["mizzen.yml", "mizzen.yaml", "slipway.yml", "slipway.yaml"]) {
    writeFileSync(join(dir, name), "title: Beacon\n");
    assert.deepEqual(detect(dir), { generator: "mizzen", sourceDir: ".", outputDir: "dist", confidence: "high", candidates: ["mizzen"] });
    rmSync(join(dir, name));
  }
});

test("detection checks the engine first, so its config wins a tie", (t) => {
  const dir = tempDir(t);
  writeFileSync(join(dir, "slipway.yml"), "title: Beacon\n");
  writeFileSync(join(dir, "mkdocs.yml"), "site_name: Beacon\n");
  const result = detect(dir);
  assert.equal(result.generator, "mizzen");
  assert.equal(result.outputDir, "dist");
  assert.equal(result.confidence, "low");
  assert.deepEqual(result.candidates, ["mizzen", "mkdocs"]);
});

test("fixtures/docs-site is an engine site", () => {
  assert.deepEqual(detect(docsSite), { generator: "mizzen", sourceDir: ".", outputDir: "dist", confidence: "high", candidates: ["mizzen"] });
});

test("the site exposes its config with positions, and no manifest without an output folder", () => {
  const site = new Site(docsSite);
  const config = site.config();
  assert.equal(config.file, "slipway.yml");
  assert.equal(config.data.title, "Beacon");
  assert.equal(config.data.base, "");
  assert.equal(config.lineOf(["base"]), 5);
  assert.equal(site.manifest(), null);
  assert.deepEqual(site.pages(), []);
  assert.deepEqual(site.sources(), []);
});

test("the site exposes the manifest's pages and their sources, once", (t) => {
  const build = tempDir(t);
  mkdirSync(join(build, ".slipway"));
  writeFileSync(
    join(build, ".slipway/manifest.json"),
    JSON.stringify({ version: 1, pages: [page("/", "index.md"), page("/quickstart/", "quickstart.md"), page("/again/", "index.md")] }),
  );
  const site = new Site(docsSite, { build });
  assert.equal(site.manifest().data.version, 1);
  assert.equal(site.pages().length, 3);
  assert.deepEqual(site.sources(), ["index.md", "quickstart.md"]);
});

test("a manifest that does not parse, or has no page list, is reported instead of thrown", (t) => {
  const build = tempDir(t);
  mkdirSync(join(build, ".slipway"));
  const file = join(build, ".slipway/manifest.json");
  writeFileSync(file, "{");
  assert.match(new Site(docsSite, { build }).manifest().errors[0].message, /JSON does not parse/);
  writeFileSync(file, JSON.stringify({ version: 1 }));
  assert.deepEqual(new Site(docsSite, { build }).manifest().errors, [{ key: "/pages", message: "must be an array" }]);
});

test("doctor reports the engine as the generator of fixtures/docs-site", async () => {
  const report = await doctor(docsSite);
  assert.equal(report.generator, "mizzen");
});
