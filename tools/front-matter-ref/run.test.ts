import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { buildFrontMatterRef, listKeys, loadSchema, referencePath, root, schemaPath } from "./run.ts";

const contracts = readFileSync(join(root, "packages/engine/src/contracts/content.ts"), "utf8");
const schema = loadSchema();

/** The typed keys of an interface in the frozen content contract, in source order. */
function interfaceKeys(name: string): string[] {
  const start = contracts.indexOf(`export interface ${name} {`);
  assert.notEqual(start, -1, `${name} is declared in the content contract`);
  const end = contracts.indexOf("\n}", start);
  return [...contracts.slice(start, end).matchAll(/^ {2}readonly ([a-z_]+)\?:/gm)].map((match) => match[1]);
}

/** Every TypeScript source file under the engine, joined. */
function engineSource(dir = join(root, "packages/engine/src")): string {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? [engineSource(path)] : path.endsWith(".ts") ? [readFileSync(path, "utf8")] : [];
    })
    .join("\n");
}

test("the site front-matter reference is generated from the engine schema and in sync", () => {
  assert.equal(readFileSync(referencePath, "utf8"), buildFrontMatterRef(schema), "run node tools/front-matter-ref/run.ts --write");
});

test("the schema is draft 2020-12, open to unknown keys, and alphabetical", () => {
  const raw = JSON.parse(readFileSync(schemaPath, "utf8"));
  assert.equal(raw.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(raw.additionalProperties, true, "an unknown key is kept, never rejected");
  assert.equal(raw.required, undefined, "every key is optional");
  const keys = Object.keys(schema.properties);
  assert.deepEqual(keys, [...keys].sort(), "schema properties are alphabetical");
});

test("every schema key is one the engine reads, and no typed key is missing", () => {
  const typed = interfaceKeys("FrontMatter");
  const source = engineSource();
  for (const key of Object.keys(schema.properties)) {
    assert.ok(typed.includes(key) || source.includes(`frontMatter.${key}`), `${key} is a key the engine reads`);
  }
  for (const key of typed) assert.ok(key in schema.properties, `${key} is in the schema`);
});

test("the agent key lists the fields of AgentInstructions", () => {
  const agent = schema.properties.agent;
  assert.equal(agent.type, "object");
  assert.deepEqual(Object.keys(agent.properties ?? {}), interfaceKeys("AgentInstructions").sort());
});

test("the page lists every key in the schema with its type and what it does", () => {
  const page = readFileSync(referencePath, "utf8");
  for (const row of listKeys(schema)) {
    assert.ok(page.includes(`| \`${row.key}\` |`), `${row.key} has a row`);
    assert.ok(row.description.length > 0, `${row.key} says what it does`);
  }
});
