import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { detect } from "../src/detect.mjs";

const fixture = (name) => fileURLToPath(new URL(`fixtures/detect/${name}`, import.meta.url));

/** An empty temporary folder, removed after the test. */
function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-detect-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const table = [
  ["jekyll", ".", "_site"],
  ["hugo", "content", "public"],
  ["astro", "src", "dist"],
  ["docusaurus", "docs", "build"],
  ["mkdocs", "docs", "site"],
  ["eleventy", ".", "_site"],
];

for (const [generator, sourceDir, outputDir] of table) {
  test(`the ${generator} fixture is detected with its folders`, () => {
    assert.deepEqual(detect(fixture(generator)), { generator, sourceDir, outputDir, confidence: "high", candidates: [generator] });
  });
}

test("Hugo's config.toml counts only with a baseURL", (t) => {
  const dir = tempDir(t);
  writeFileSync(join(dir, "config.toml"), 'title = "No base"\n');
  assert.equal(detect(dir).generator, "unknown");
  writeFileSync(join(dir, "config.toml"), 'baseURL = "https://example.org/"\n');
  assert.equal(detect(dir).generator, "hugo");
});

test("Jekyll's _config.yml alone is not enough", (t) => {
  const dir = tempDir(t);
  writeFileSync(join(dir, "_config.yml"), "title: x\n");
  assert.equal(detect(dir).generator, "unknown");
});

test("a folder with two markers reports the stronger one with lower confidence", (t) => {
  const dir = tempDir(t);
  cpSync(fixture("jekyll"), dir, { recursive: true });
  cpSync(fixture("mkdocs"), dir, { recursive: true });
  const result = detect(dir);
  assert.equal(result.generator, "mkdocs");
  assert.equal(result.outputDir, "site");
  assert.equal(result.confidence, "low");
  assert.deepEqual(result.candidates.sort(), ["jekyll", "mkdocs"]);
});

test("an empty or missing folder returns unknown without throwing", (t) => {
  const unknown = { generator: "unknown", sourceDir: null, outputDir: null, confidence: "none", candidates: [] };
  assert.deepEqual(detect(tempDir(t)), unknown);
  assert.deepEqual(detect(join(tmpdir(), "slipway-detect-does-not-exist")), unknown);
});
