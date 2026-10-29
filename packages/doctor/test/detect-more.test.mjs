import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { detect } from "../src/detect.mjs";

const fixture = (name) => fileURLToPath(new URL(`fixtures/${name}`, import.meta.url));

const table = [
  ["vitepress", ".", ".vitepress/dist"],
  ["starlight", "src", "dist"],
  ["zola", "content", "public"],
  ["mdbook", "src", "book"],
  ["hexo", "source", "public"],
  ["quarto", ".", "_site"],
  ["sphinx", ".", "_build/html"],
  ["pelican", "content", "output"],
  ["nextra", "pages", ".next"],
];

for (const [generator, sourceDir, outputDir] of table) {
  test(`the ${generator} fixture is detected with its folders`, () => {
    assert.deepEqual(detect(fixture(`detect-${generator}`)), { generator, sourceDir, outputDir, confidence: "high", candidates: [generator] });
  });
}
