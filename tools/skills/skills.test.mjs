import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { buildConfigReference, listKeys, loadSchema, referencePath, root } from "./config-reference.mjs";

const skillDir = join(root, "skills/slipway-site");
const skill = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const [, , body] = skill.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
const examples = readdirSync(join(root, "examples")).map((name) => join(root, "examples", name));

test("the config reference is generated from the schema and in sync", () => {
  const schema = loadSchema();
  const reference = buildConfigReference(schema);
  assert.equal(readFileSync(referencePath, "utf8"), reference, "run node tools/skills/config-reference.mjs");
  for (const row of listKeys(schema)) assert.ok(reference.includes(`| \`${row.key}\` |`), row.key);
});

test("every path the skill names exists in the theme or in an example site", () => {
  const isPath = (s) => !s.includes("<") && !s.includes(" ") && !s.startsWith("--") && /\/|\.(md|yml|json|xml|html|css)$/.test(s);
  const paths = [...body.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]).filter(isPath);
  const links = [...body.matchAll(/\]\(([^)#]+)\)/g)].map((m) => m[1]).filter((p) => !p.startsWith("http"));
  const repo = [...body.matchAll(/https:\/\/github\.com\/arminazimi\/slipway\/(?:blob|tree)\/main\/([^\s)]+?)\.?(?=[\s)]|$)/g)].map((m) => m[1]);
  assert.ok(paths.length > 10 && repo.length >= 3, "found the references");
  for (const p of links) assert.ok(existsSync(join(skillDir, p)), p);
  for (const p of repo) assert.ok(existsSync(join(root, p)), p);
  // A path like `/fa/` or `/about.html` is an address on the site, not a file.
  for (const p of paths.filter((p) => !p.startsWith("/"))) {
    const found = [root, ...examples].some((dir) => existsSync(join(dir, p))) || p.startsWith("_site/");
    assert.ok(found, p);
  }
});

test("the first config snippet is the remote_theme setup a new site starts from", () => {
  const blocks = [...body.matchAll(/```yaml\n([\s\S]*?)```/g)].map((m) => parse(m[1]));
  assert.equal(blocks[0].remote_theme, "arminazimi/slipway");
  assert.ok(blocks[0].plugins.includes("jekyll-remote-theme"));
});
