import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { frontMatter, schemaFor, validateFrontMatter } from "../theme/front-matter.ts";
import { root } from "./config-reference.ts";

const skillDir = join(root, "skills/slipway-content");
const skill = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const [, , body] = skill.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
const referencePath = join(skillDir, "reference/front-matter.md");
const adr = readFileSync(join(root, "docs/adr/0024-site-config.md"), "utf8");

function example(name) {
  const text = readFileSync(join(skillDir, "examples", name), "utf8");
  const source = frontMatter(text);
  const target = source.match(/^# Save as (\S+?)[,:.]?\s/m)?.[1];
  return { text, data: parse(source), target, content: text.slice(text.indexOf("\n---\n", 4) + 5) };
}

test("the front matter reference lists every key the engine reads (ADR 0024, rule 3)", () => {
  // Rule 3's table names the keys the engine gives meaning to; the other keys in the rule are listed by hand.
  const rule = adr.slice(adr.indexOf("3. **Front matter the engine reads.**"), adr.indexOf("4. **Compatibility"));
  const keys = [
    ...[...rule.matchAll(/^ {3}\| `([a-z_]+)` \|/gm)].map((m) => m[1]),
    "image",
    "translation_key",
    "search",
    "published",
    "nav_order",
    "direction",
  ];
  assert.ok(keys.length >= 16, `found ${keys.length} keys`);
  const reference = readFileSync(referencePath, "utf8");
  for (const key of keys) assert.ok(reference.includes(`| \`${key}\` |`), key);
});

test("the examples pass the front matter schema for the file they name", () => {
  for (const name of ["doc-page.md", "post.md", "post-fa.md"]) {
    const { data, target } = example(name);
    assert.ok(target, `${name} says where it goes`);
    assert.deepEqual(validateFrontMatter(data, target), [], name);
    if (data.layout !== undefined) assert.equal(schemaFor(data, target), data.layout, name);
  }
});

test("the doc page takes its URL from its path and its layout from the theme", () => {
  const doc = example("doc-page.md");
  assert.match(doc.target, /^docs\/[a-z-]+\.md$/);
  assert.equal(doc.data.layout, undefined, "the theme's default layout");
  assert.equal(doc.data.permalink, undefined, "the URL comes from the path");
  assert.equal(typeof doc.data.order, "number");
});

test("the Persian post is the translation of the English post", () => {
  const post = example("post.md");
  const fa = example("post-fa.md");
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

test("the skill checks its work with slipway check", () => {
  const commands = [...body.matchAll(/```sh\n([\s\S]*?)```/g)].flatMap((m) => m[1].trim().split("\n"));
  assert.ok(commands.includes("slipway check ."), "runs the check");
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
