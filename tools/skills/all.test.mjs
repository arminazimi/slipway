// The checks every skill shares, run over every folder in skills/ that has a SKILL.md:
// front matter, line budget, relative links, commands, and the YAML snippets that are config,
// navigation, or front matter samples. A new skill is checked without editing this file.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { parse } from "yaml";
import { root } from "./config-reference.mjs";
import { validateFrontMatter } from "../theme/front-matter.mjs";

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const skills = readdirSync(join(root, "skills"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(root, "skills", entry.name, "SKILL.md")))
  .map((entry) => entry.name)
  .sort();

const ajv = new Ajv2020({ allErrors: true, strict: false });
const config = ajv.compile(JSON.parse(readFileSync(join(root, "schema/slipway-config.schema.json"), "utf8")));
const navigation = ajv.compile(JSON.parse(readFileSync(join(root, "schema/navigation.schema.json"), "utf8")));

function read(name) {
  const dir = join(root, "skills", name);
  const source = readFileSync(join(dir, "SKILL.md"), "utf8");
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.ok(match, `${name}/SKILL.md has a front matter block`);
  return { dir, source, meta: parse(match[1]), body: match[2] };
}

function commands(body) {
  const block = [...body.matchAll(/```(?:sh|bash|shell)\n([\s\S]*?)```/g)].flatMap((m) => m[1].trim().split("\n"));
  const inline = [...body.matchAll(/`((?:npm run|node|bundle exec) [^`]+)`/g)].map((m) => m[1]);
  return [...block, ...inline].map((line) => line.trim()).filter(Boolean);
}

assert.ok(skills.length >= 3, "found the skill folders");

for (const name of skills) {
  test(`${name}: front matter names the skill and fits the limits`, () => {
    const { source, meta } = read(name);
    assert.deepEqual(Object.keys(meta).sort(), ["description", "name"], "only name and description");
    assert.equal(meta.name, name, "the name matches the folder");
    assert.match(meta.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(meta.name.length <= 64);
    assert.equal(typeof meta.description, "string");
    assert.ok(meta.description.length > 0 && meta.description.length <= 1024);
    assert.doesNotMatch(meta.description, /[<>\n]/);
    assert.ok(source.split("\n").length < 160, `${source.split("\n").length} lines`);
  });

  test(`${name}: every relative link resolves inside the skill`, () => {
    const { dir, body } = read(name);
    const links = [...body.matchAll(/\]\(([^)#]+)\)/g)].map((m) => m[1]).filter((p) => !p.startsWith("http") && !p.startsWith("/"));
    for (const link of links) assert.ok(existsSync(join(dir, link)), link);
  });

  test(`${name}: every repository path it names exists`, () => {
    const { dir, body } = read(name);
    // Only the folders that hold code are meant as files; `fa/about.md` or `_data/authors.yml`
    // in the text are files a site will create, not files this repository has. A `<...>` part is a placeholder.
    const owned = /^(?:tools|packages|schema|skills|spec|action|plugins|planning)\/|^changelog\.d\/[^<]+$/;
    const spans = [...body.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]).filter((s) => owned.test(s));
    for (const span of spans) assert.ok(existsSync(join(dir, span)) || existsSync(join(root, span)), span);
  });

  test(`${name}: every command exists in this repository`, () => {
    const { body } = read(name);
    const found = commands(body);
    assert.ok(found.length > 0, "the skill shows a command");
    for (const command of found) {
      const npm = command.match(/^npm run ([\w:-]+)/);
      const installed = command.match(/^node "\$HOME\/\.slipway\/([^"]+)"/);
      const node = command.match(/^node "?([^"\s]+)"?/);
      if (npm) assert.ok(pkg.scripts[npm[1]], command);
      else if (installed) assert.ok(existsSync(join(root, installed[1])), command);
      else if (node) assert.ok(existsSync(join(root, node[1])), command);
      else assert.match(command, /^(bundle exec jekyll (build|serve)|git |gh |cd |npm (?:ci|install)\b)/, command);
    }
  });

  test(`${name}: config, navigation, and front matter snippets validate`, () => {
    const { body } = read(name);
    for (const [, text] of body.matchAll(/```yaml\n([\s\S]*?)```/g)) {
      const data = parse(text);
      if (!data || typeof data !== "object" || Array.isArray(data)) continue;
      if ("main" in data || "main_fa" in data || "main_de" in data || "docs" in data) {
        assert.ok(navigation(data), `${name}: ${JSON.stringify(navigation.errors)}`);
      } else if ("layout" in data) {
        assert.deepEqual(validateFrontMatter(data), [], name);
      } else if ("slipway" in data || "remote_theme" in data || "plugins" in data || "url" in data || "baseurl" in data) {
        assert.ok(config(data), `${name}: ${JSON.stringify(config.errors)}`);
      }
      // Other blocks (an i18n strings file, a data file) have their own schema, not these two.
    }
  });
}
