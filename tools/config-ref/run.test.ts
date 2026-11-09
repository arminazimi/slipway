import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildConfigDoc, listKeys, loadSchema, referencePath } from "./run.ts";

test("the site config reference is generated from the engine schema and in sync", () => {
  const schema = loadSchema();
  const reference = buildConfigDoc(schema);
  assert.equal(readFileSync(referencePath, "utf8"), reference, "run node tools/config-ref/run.ts --write");
  for (const row of listKeys(schema)) assert.ok(reference.includes(`| \`${row.key}\` |`), row.key);
});

test("the page is built from the engine schema, never from the old site config", () => {
  const reference = buildConfigDoc(loadSchema());
  assert.match(reference, /^---\ntitle: Configuration\ndescription: Slipway configuration reference\.\nlayout: doc\n/);
  assert.match(reference, /Generated from packages\/engine\/schema\/config\.schema\.json by tools\/config-ref\/run\.ts/);
  assert.doesNotMatch(reference, /_config\.yml|Jekyll/);
});

test("a key that is a choice between a value and an object lists the object's keys", () => {
  const keys = listKeys(loadSchema()).map((row) => row.key);
  assert.ok(keys.includes("search"));
  assert.ok(keys.includes("search.text"));
  assert.ok(keys.includes("languages[].code"));
});
