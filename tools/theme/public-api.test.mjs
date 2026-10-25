import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { cssVar, exposedTokens, loadTokens, root } from "./tokens.mjs";

// ADR 0012 lists the public API; these tests keep it in step with the schema, the tokens, and the layouts.
const adr = readFileSync(join(root, "docs/adr/0012-public-api.md"), "utf8");

/** Dotted paths of every leaf property in a JSON Schema (arrays of objects list their item keys in parentheses). */
function schemaKeys(schema, prefix = "") {
  const keys = [];
  for (const [name, prop] of Object.entries(schema.properties ?? {})) {
    const path = prefix ? `${prefix}.${name}` : name;
    if (prop.properties) keys.push(...schemaKeys(prop, path));
    else keys.push(path);
  }
  return keys;
}

test("the ADR names every key in the config schema", () => {
  const schema = JSON.parse(readFileSync(join(root, "schema/slipway-config.schema.json"), "utf8"));
  const keys = schemaKeys(schema);
  assert.ok(keys.length > 5, "the schema has keys");
  for (const key of keys) assert.ok(adr.includes(`\`${key}\``), key);
});

test("the ADR names every CSS custom property the theme exposes", () => {
  for (const token of exposedTokens(loadTokens())) assert.ok(adr.includes(`\`${cssVar(token.name)}\``), cssVar(token.name));
});

test("the layouts table matches _layouts/, and every test file the ADR names exists", () => {
  for (const [, name] of adr.matchAll(/`([a-z-]+\.test\.mjs)`/g)) assert.ok(existsSync(join(root, "tools/theme", name)), name);
  const layoutRows = adr.split("### Layouts")[1].split("###")[0].split("\n").filter((line) => line.startsWith("| `"));
  const layouts = layoutRows.flatMap((line) => [...line.split("|")[1].matchAll(/`([a-z-]+)`/g)].map((m) => m[1]));
  assert.ok(layouts.length >= 10, "the layouts table is found");
  for (const name of layouts) assert.ok(existsSync(join(root, "_layouts", `${name}.html`)), name);
  for (const file of readdirSync(join(root, "_layouts"))) assert.ok(layouts.includes(file.replace(/\.html$/, "")), `${file} is not in the ADR`);
});
