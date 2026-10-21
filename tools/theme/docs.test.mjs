import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const modes = join(root, "docs/modes.md");
const text = readFileSync(modes, "utf8");

test("docs/modes.md describes both modes and the feature table", () => {
  assert.match(text, /\*\*Classic\*\*/);
  assert.match(text, /\*\*Actions mode\*\*/);
  assert.match(text, /## What each feature needs/);
});

test("every relative link in docs/modes.md points at a file that exists", () => {
  const links = [...text.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)].map((m) => m[1]).filter((href) => !/^[a-z]+:/.test(href));
  assert.ok(links.length > 0);
  for (const href of links) assert.ok(existsSync(resolve(dirname(modes), href)), `${href} does not exist`);
});

test("the README links to docs/modes.md", () => {
  assert.match(readFileSync(join(root, "README.md"), "utf8"), /\(docs\/modes\.md\)/);
});
