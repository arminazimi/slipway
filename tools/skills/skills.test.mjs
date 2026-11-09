import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { buildConfigReference, listKeys, loadSchema, referencePath, root } from "./config-reference.mjs";

const skillDir = join(root, "skills/slipway-site");
const skill = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const [, , body] = skill.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];

test("the config reference is generated from the schema and in sync", () => {
  const schema = loadSchema();
  const reference = buildConfigReference(schema);
  assert.equal(readFileSync(referencePath, "utf8"), reference, "run node tools/skills/config-reference.mjs");
  for (const row of listKeys(schema)) assert.ok(reference.includes(`| \`${row.key}\` |`), row.key);
});

test("the first config snippet is the remote_theme setup a new site starts from", () => {
  const blocks = [...body.matchAll(/```yaml\n([\s\S]*?)```/g)].map((m) => parse(m[1]));
  assert.equal(blocks[0].remote_theme, "arminazimi/slipway");
  assert.ok(blocks[0].plugins.includes("jekyll-remote-theme"));
});
