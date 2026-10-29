import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { buildFrontMatterDoc, listKeys, loadSchemas, root } from "./front-matter-doc.mjs";

const referencePath = join(root, "site/front-matter.md");

test("the site front-matter reference is generated from the schema and in sync", () => {
  const schemas = loadSchemas();
  const reference = buildFrontMatterDoc(schemas);
  assert.equal(readFileSync(referencePath, "utf8"), reference, "run node tools/theme/front-matter-doc.mjs");
  for (const name of Object.keys(schemas)) {
    for (const row of listKeys(schemas, name)) assert.ok(reference.includes(`| \`${row.key}\` |`), `${name}: ${row.key}`);
  }
});
