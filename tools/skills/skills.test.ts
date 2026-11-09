import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";
import { parse } from "yaml";
import { buildConfigReference, listKeys, loadSchema, referencePath, root, schemaPath } from "./config-reference.ts";

const skillDir = join(root, "skills/slipway-site");
const skill = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const [, , body] = skill.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
const validateConfig = new Ajv2020({ allErrors: true }).compile(JSON.parse(readFileSync(schemaPath, "utf8")));

/** Every Markdown file under a Skill folder, to check what the Skill says about the engine. */
function markdownUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return markdownUnder(path);
    return entry.name.endsWith(".md") ? [path] : [];
  });
}

test("the config reference is generated from the engine schema and in sync", () => {
  const schema = loadSchema();
  const reference = buildConfigReference(schema);
  assert.equal(readFileSync(referencePath, "utf8"), reference, "run node tools/skills/config-reference.ts");
  for (const row of listKeys(schema)) assert.ok(reference.includes(`| \`${row.key}\` |`), row.key);
});

test("every slipway.yml snippet in the Skill validates against the engine config schema", () => {
  const snippets = [...body.matchAll(/```yaml\n([\s\S]*?)```/g)]
    .map((m) => m[1])
    .filter((text) => text.startsWith("# slipway.yml\n"));
  assert.ok(snippets.length >= 3, "the Skill shows slipway.yml");
  for (const text of snippets) {
    const data = parse(text);
    assert.ok(validateConfig(data), `${text}\n${JSON.stringify(validateConfig.errors)}`);
  }
});

test("the Skills describe the engine: no _config.yml, remote_theme, or Liquid", () => {
  for (const dir of [skillDir, join(root, "skills/slipway-content")]) {
    for (const file of markdownUnder(dir)) {
      const text = readFileSync(file, "utf8");
      assert.doesNotMatch(text, /_config\.yml|remote_theme|Liquid/, file);
    }
  }
});
