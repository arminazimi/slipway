import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { cpSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { sourceForUrl } from "../src/tools/source_for_url.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const testDir = join(root, ".tmp/test-source-for-url");

before(() => {
  rmSync(testDir, { recursive: true, force: true });
  cpSync(join(root, "examples/docs"), testDir, { recursive: true });

  const mockSourcemap = {
    version: 0,
    pages: [
      {
        url: "/mock/",
        source: "mock.md",
        sections: [
          { id: "mock-anchor", level: 1, line: 42, text: "Mock" }
        ]
      }
    ]
  };
  writeFileSync(join(testDir, "sourcemap.json"), JSON.stringify(mockSourcemap));
  writeFileSync(join(testDir, "mock.md"), "# Mock\n");
});

after(() => {
  rmSync(testDir, { recursive: true, force: true });
});

test("returns file and line 1 for url in sourcemap.json", () => {
  const result = sourceForUrl(testDir, { url: "/mock/" });
  assert.deepEqual(result, { file: "mock.md", line: 1 });
});

test("returns file and exact line for url and anchor in sourcemap.json", () => {
  const result = sourceForUrl(testDir, { url: "/mock/", anchor: "mock-anchor" });
  assert.deepEqual(result, { file: "mock.md", line: 42 });
});

test("returns file and line 1 for url resolved via file tree and front matter", () => {
  const result = sourceForUrl(testDir, { url: "/guide/configure/" });
  assert.deepEqual(result, { file: "guide/configure.md", line: 1 });
});

test("returns empty object for non-existent url", () => {
  const result = sourceForUrl(testDir, { url: "/nonexistent/" });
  assert.deepEqual(result, {});
});

test("returns empty object for path traversal urls", () => {
  const result1 = sourceForUrl(testDir, { url: "../../etc/passwd" });
  assert.deepEqual(result1, {});

  const result2 = sourceForUrl(testDir, { url: "..\\..\\windows\\system32" });
  assert.deepEqual(result2, {});
});
