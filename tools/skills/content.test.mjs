import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { frontMatter, schemaFor, validateFrontMatter } from "../theme/front-matter.mjs";
import { buildFrontMatterReference, listKeys, loadSchemas, referencePath, root } from "./front-matter-reference.mjs";

const skillDir = join(root, "skills/slipway-content");
const skill = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const [, meta, body] = skill.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
const theme = '"$HOME/.slipway/';

function example(name) {
  const text = readFileSync(join(skillDir, "examples", name), "utf8");
  const source = frontMatter(text);
  const target = source.match(/^# Save as (\S+?)[,:.]?\s/m)?.[1];
  return { text, data: parse(source), target, content: text.slice(text.indexOf("\n---\n", 4) + 5) };
}

test("SKILL.md has valid frontmatter and stays under 150 lines", () => {
  assert.ok(meta, "frontmatter block");
  const data = parse(meta);
  assert.deepEqual(Object.keys(data).sort(), ["description", "name"]);
  assert.equal(data.name, "slipway-content");
  assert.ok(data.description.length > 0 && data.description.length <= 1024);
  assert.doesNotMatch(data.description, /[<>\n]/);
  assert.ok(skill.split("\n").length < 150, `${skill.split("\n").length} lines`);
});

test("the front matter reference is generated from the schemas and in sync", () => {
  const schemas = loadSchemas();
  const reference = buildFrontMatterReference(schemas);
  assert.equal(readFileSync(referencePath, "utf8"), reference, "run node tools/skills/front-matter-reference.mjs");
  for (const name of Object.keys(schemas)) {
    for (const row of listKeys(schemas, name)) assert.ok(reference.includes(`| \`${row.key}\` |`), `${name}: ${row.key}`);
  }
});

test("the three examples pass the front matter schema for the file they name", () => {
  for (const name of ["doc-page.md", "post.md", "post-fa.md"]) {
    const { data, target } = example(name);
    assert.ok(target, `${name} says where it goes`);
    assert.deepEqual(validateFrontMatter(data, target), [], name);
    assert.equal(schemaFor(data, target), data.layout, name);
  }
});

test("the examples are a doc page, a post with tags, and its Persian translation", () => {
  const doc = example("doc-page.md");
  const post = example("post.md");
  const fa = example("post-fa.md");
  assert.equal(doc.data.layout, "doc");
  assert.match(doc.data.permalink, /^\//);
  for (const { target, data } of [post, fa]) {
    assert.equal(data.layout, "post");
    assert.match(target, /^_posts\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/);
    assert.ok(Array.isArray(data.tags) && data.tags.length > 0);
  }
  assert.notEqual(post.target, fa.target);
  assert.equal(post.target.slice(7, 17), fa.target.slice(7, 17), "same date");
  assert.equal(fa.data.lang, "fa");
  assert.equal(post.data.lang, "en", "the switcher matches a translation by lang");
  assert.match(fa.data.permalink, /^\/fa\//);
  assert.ok(post.data.translation_key);
  assert.equal(fa.data.translation_key, post.data.translation_key);
  assert.equal(fa.data.direction ?? fa.data.dir, undefined, "the direction comes from lang");
  assert.doesNotMatch(fa.text, /[يك]/, "Persian ی and ک, not Arabic");
});

test("no example uses Liquid or a second h1", () => {
  for (const name of ["doc-page.md", "post.md", "post-fa.md"]) {
    const { content } = example(name);
    assert.doesNotMatch(content, /\{\{|\{%/, name);
    assert.doesNotMatch(content.replace(/```[\s\S]*?```/g, ""), /^# /m, name);
  }
});

test("every link, path, and command in the skill exists", () => {
  // A link starting with `/` is an address on the site, shown as an example.
  const links = [...body.matchAll(/\]\(([^)#]+)\)/g)].map((m) => m[1]).filter((p) => !p.startsWith("http") && !p.startsWith("/"));
  assert.ok(links.length >= 4);
  for (const p of links) assert.ok(existsSync(join(skillDir, p)), p);
  const commands = [...body.matchAll(/```sh\n([\s\S]*?)```/g)].flatMap((m) => m[1].trim().split("\n"));
  assert.ok(commands.length >= 4);
  for (const command of commands) {
    const script = command.match(/^node "\$HOME\/\.slipway\/([^"]+)"/);
    if (script) assert.ok(existsSync(join(root, script[1])), command);
    else assert.match(command, /^(git clone --depth 1 https:\/\/github\.com\/arminazimi\/slipway |cd |bundle exec jekyll build$)/, command);
  }
  assert.ok(commands.some((c) => c.startsWith(`node ${theme}packages/doctor/`) && c.includes(" doctor . ")), "runs the doctor");
  assert.ok(commands.some((c) => c.startsWith(`node ${theme}tools/theme/validate.mjs`)), "runs the schema check");
});

test("the translation recipe exists and has valid paths and commands", () => {
  const recipePath = join(skillDir, "reference/translate-page.md");
  assert.ok(existsSync(recipePath), "translate-page.md exists");
  const recipeBody = readFileSync(recipePath, "utf8");
  assert.match(recipeBody, /translation_key/);
  assert.match(recipeBody, /links/);
  const commands = [...recipeBody.matchAll(/```sh\n([\s\S]*?)```/g)].flatMap((m) => m[1].trim().split("\n"));
  for (const command of commands) {
    const script = command.match(/^node "\$HOME\/\.slipway\/([^"]+)"/);
    if (script) assert.ok(existsSync(join(root, script[1])), command);
  }
});
