import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { parse } from "yaml";
import { buildConfigReference, listKeys, loadSchema, referencePath, root } from "./config-reference.mjs";

const skillDir = join(root, "skills/slipway-site");
const skill = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const [, frontMatter, body] = skill.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const examples = readdirSync(join(root, "examples")).map((name) => join(root, "examples", name));

test("SKILL.md has valid frontmatter and stays under 150 lines", () => {
  assert.ok(frontMatter, "frontmatter block");
  const meta = parse(frontMatter);
  assert.deepEqual(Object.keys(meta).sort(), ["description", "name"]);
  assert.equal(meta.name, "slipway-site");
  assert.match(meta.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.ok(meta.name.length <= 64);
  assert.equal(typeof meta.description, "string");
  assert.ok(meta.description.length > 0 && meta.description.length <= 1024);
  assert.doesNotMatch(meta.description, /[<>\n]/);
  assert.ok(skill.split("\n").length < 150, `${skill.split("\n").length} lines`);
});

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

test("every command the skill runs exists", () => {
  const commands = [...body.matchAll(/```sh\n([\s\S]*?)```/g)].flatMap((m) => m[1].trim().split("\n"));
  commands.push(...[...body.matchAll(/`((?:npm run|node|bundle exec) [^`]+)`/g)].map((m) => m[1]));
  assert.ok(commands.length > 0);
  for (const command of commands) {
    const npm = command.match(/^npm run ([\w:-]+)/);
    const node = command.match(/^node (\S+)/);
    if (npm) assert.ok(pkg.scripts[npm[1]], command);
    else if (node) assert.ok(existsSync(join(root, node[1])), command);
    else assert.match(command, /^bundle exec jekyll (build|serve)$/, command);
  }
  assert.match(readFileSync(join(root, "Gemfile"), "utf8"), /gem "github-pages"/);
});

test("the YAML snippets in the skill validate against the config and navigation schemas", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const config = ajv.compile(loadSchema());
  const navigation = ajv.compile(JSON.parse(readFileSync(join(root, "schema/navigation.schema.json"), "utf8")));
  const blocks = [...body.matchAll(/```yaml\n([\s\S]*?)```/g)].map((m) => parse(m[1]));
  assert.ok(blocks.length >= 4);
  for (const data of blocks) {
    const validate = "main" in data ? navigation : config;
    assert.ok(validate(data), JSON.stringify(validate.errors));
  }
  assert.equal(blocks[0].remote_theme, "arminazimi/slipway");
  assert.ok(blocks[0].plugins.includes("jekyll-remote-theme"));
});
