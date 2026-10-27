import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { cpSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { listPages } from "../src/tools/list_pages.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const testDir = join(root, ".tmp/test-list-pages");

before(() => {
  rmSync(testDir, { recursive: true, force: true });
  cpSync(join(root, "examples/docs"), testDir, { recursive: true });
});

after(() => {
  rmSync(testDir, { recursive: true, force: true });
});

test("lists pages without filters", () => {
  const result = listPages(testDir);
  assert.ok(Array.isArray(result.pages));
  assert.ok(result.pages.length > 0);

  const index = result.pages.find((p) => p.file === "index.md");
  assert.ok(index, "index.md should be in the list");
  assert.equal(index.url, "/");
  assert.equal(index.layout, "home");

  const guideIndex = result.pages.find((p) => p.file === "guide/index.md");
  assert.ok(guideIndex, "guide/index.md should be in the list");
  assert.equal(guideIndex.url, "/guide/");
  assert.equal(guideIndex.layout, "doc");
  assert.equal(guideIndex.title, "Overview");

  const configure = result.pages.find((p) => p.file === "guide/configure.md");
  assert.ok(configure, "guide/configure.md should be in the list");
  assert.equal(configure.url, "/guide/configure/");
});

test("filters by layout", () => {
  const result = listPages(testDir, { layout: "home" });
  assert.equal(result.pages.length, 1);
  assert.equal(result.pages[0].file, "index.md");
});

test("filters by lang", () => {
  const result = listPages(testDir, { lang: "fr" }); // no fr pages in examples/docs
  assert.equal(result.pages.length, 0);
});

test("filters by folder", () => {
  const result = listPages(testDir, { folder: "guide" });
  assert.ok(result.pages.length > 0);
  assert.ok(result.pages.every((p) => p.file.startsWith("guide/")));
});

test("rejects folder outside site", () => {
  assert.throws(() => listPages(testDir, { folder: "../" }), /outside the site/);
});
