import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { test } from "node:test";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const examples = readdirSync(join(root, "examples"), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
const rawBase = "https://raw.githubusercontent.com/arminazimi/slipway/main/";
const modeline = /^# yaml-language-server: \$schema=(\S+)\n/;

// A raw GitHub URL on main resolves to a file in this repository.
const repoPath = (url) => (url.startsWith(rawBase) ? url.slice(rawBase.length) : null);

test("every example's _config.yml and navigation.yml name an existing schema on their first line", () => {
  const files = { "_config.yml": "schema/slipway-config.schema.json", "_data/navigation.yml": "schema/navigation.schema.json" };
  for (const example of examples) {
    for (const [file, schema] of Object.entries(files)) {
      const path = `examples/${example}/${file}`;
      const match = read(path).match(modeline);
      assert.ok(match, `${path} starts with a yaml-language-server comment`);
      const target = join(root, dirname(path), match[1]);
      assert.ok(existsSync(target), `${path} points at ${match[1]}, which exists`);
      assert.equal(relative(root, target), schema, path);
    }
  }
});

test("starter-files/.vscode/settings.json maps the config and navigation to existing schemas", () => {
  const { "yaml.schemas": schemas } = JSON.parse(read("starter-files/.vscode/settings.json"));
  const globs = {};
  for (const [url, patterns] of Object.entries(schemas)) {
    const path = repoPath(url);
    assert.ok(path && existsSync(join(root, path)), `${url} is a file in this repository`);
    for (const glob of [patterns].flat()) globs[glob] = path;
  }
  assert.equal(globs["_config.yml"], "schema/slipway-config.schema.json");
  assert.equal(globs["_data/navigation.yml"], "schema/navigation.schema.json");
});

test("docs/editor.md links only schemas that exist and covers VS Code and another editor", () => {
  const docs = read("docs/editor.md");
  for (const [, path] of docs.matchAll(/\]\(\.\.\/([^)#]+)\)/g)) assert.ok(existsSync(join(root, path)), path);
  for (const url of docs.match(/https:\/\/raw\.githubusercontent\.com\/\S+?\.json/g)) {
    assert.ok(existsSync(join(root, repoPath(url))), url);
  }
  for (const heading of ["## VS Code", "## Neovim", "## Zed", "## Front matter"]) assert.ok(docs.includes(heading), heading);
});
