import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { buildConfigDoc, listKeys, loadSchema, root } from "./config-doc.mjs";

const referencePath = join(root, "site/config.md");

test("the site config reference is generated from the schema and in sync", () => {
  const schema = loadSchema();
  const reference = buildConfigDoc(schema);
  assert.equal(readFileSync(referencePath, "utf8"), reference, "run node tools/theme/config-doc.mjs");
  for (const row of listKeys(schema)) assert.ok(reference.includes(`| \`${row.key}\` |`), row.key);
});
