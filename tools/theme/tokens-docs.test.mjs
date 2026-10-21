import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { configMap } from "./config-map.mjs";
import { staleOutputs } from "./tokens-build.mjs";
import { buildTokenDocs } from "./tokens-docs.mjs";
import { cssVar, exposedTokens, listTokens, loadTokens, root } from "./tokens.mjs";

const tokens = loadTokens();
const docs = buildTokenDocs(tokens);

test("every token has a purpose, and the page names every CSS variable", () => {
  assert.deepEqual(listTokens(tokens).filter((t) => t.description.trim() === "").map((t) => t.name), []);
  for (const t of exposedTokens(tokens)) assert.ok(docs.includes(`\`${cssVar(t.name)}\``), cssVar(t.name));
});

test("the page lists every _config.yml override key and its variables", () => {
  for (const [key, vars] of Object.entries(configMap)) {
    assert.ok(docs.includes(`| \`${key}\` |`), key);
    for (const name of vars) assert.ok(docs.includes(`\`${name}\``), name);
  }
});

test("pipes in values do not break the table", () => {
  const odd = { a: { $type: "css", $value: "x | y", $description: "has | pipe" } };
  assert.match(buildTokenDocs(odd), /has \\\| pipe/);
});

test("docs/tokens.md on disk matches the tokens, and staleOutputs notices a stale page", () => {
  assert.equal(readFileSync(join(root, "docs/tokens.md"), "utf8"), docs);
  const dir = mkdtempSync(join(tmpdir(), "slipway-docs-"));
  const path = join(dir, "tokens.md");
  assert.deepEqual(staleOutputs(tokens, { css: null, docs: path }), [path]);
  writeFileSync(path, docs);
  assert.deepEqual(staleOutputs(tokens, { css: null, docs: path }), []);
  writeFileSync(path, `${docs}\nedited`);
  assert.deepEqual(staleOutputs(tokens, { css: null, docs: path }), [path]);
});
