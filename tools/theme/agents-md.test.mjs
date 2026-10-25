// starter-files/AGENTS.md is what an agent reads before it edits a site (spec section 1). These tests keep
// it true: every path and command it names exists, its examples pass the schemas, and it stays short.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { parse } from "yaml";
import { frontMatter, validateFrontMatter } from "./front-matter.mjs";
import { root } from "./tokens.mjs";

const source = readFileSync(join(root, "starter-files/AGENTS.md"), "utf8");
const output = "_site/";
const minimal = join(root, "examples/minimal");
// A new site is examples/bare plus starter-files/ (what create-slipway copies); minimal is the full example.
const newSite = [join(root, "examples/bare"), join(root, "starter-files")].filter((dir) => existsSync(dir));
const sites = { minimal: [minimal], ...(newSite.length > 1 ? { "a new site": newSite } : {}) };

const fences = [...source.matchAll(/^```(\w*)\n([\s\S]*?)^```$/gm)].map(([, info, body]) => ({ info, body }));
const prose = source.replace(/^```\w*\n[\s\S]*?^```$/gm, "");
const spans = [...prose.matchAll(/`([^`\n]+)`/g)].map(([, span]) => span);
// The spec's test for a source path: has a slash or a file extension, and no spaces (ae.agents-md.paths-exist).
const looksLikePath = (span) => /\/|\.[a-z]+$/i.test(span) && !/\s/.test(span) && !span.startsWith("/") && !/^https?:/.test(span);
const placeholder = /<[^>]+>/;

/** Every file and folder under dir, as relative paths with forward slashes; folders end in "/". */
function listing(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    const rel = relative(base, path).split("\\").join("/");
    return entry.isDirectory() ? [`${rel}/`, ...listing(path, base)] : [rel];
  });
}

const existsIn = (dirs, path) => dirs.some((dir) => existsSync(join(dir, path)));
const shape = (path) => new RegExp(`^${path.split(placeholder).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[^/]+")}$`);

test("AGENTS.md is under 120 lines and 32 KiB, and every copy matches starter-files", () => {
  assert.ok(source.trimEnd().split("\n").length < 120, "under 120 lines");
  assert.ok(Buffer.byteLength(source) <= 32768, "at most 32 KiB (ae.agents-md.size)");
  assert.match(frontMatter(source), /^published: false$/m, "kept out of the built site");
  assert.equal(readFileSync(join(minimal, "AGENTS.md"), "utf8"), source, "examples/minimal/AGENTS.md is a copy");
  assert.match(readFileSync(join(root, "starter-files/README.md"), "utf8"), /`AGENTS\.md`/, "starter-files/README.md lists it");
});

test("AGENTS.md meets the spec's AGENTS.md requirements", () => {
  assert.ok(spans.includes(output), "names the output folder (ae.agents-md.layout)");
  assert.match(source, /^## (Never|Do not)[^\n]*\n\n- /m, "a Never section with a list (ae.agents-md.never)");
  assert.ok(fences.some(({ info }) => ["sh", "bash", "shell"].includes(info)), "a sh block with the check (ae.agents-md.verify)");
});

for (const [name, dirs] of Object.entries(sites)) {
  test(`every path AGENTS.md names in a code span exists in ${name}`, () => {
    for (const span of spans.filter(looksLikePath)) {
      if (span === output || placeholder.test(span)) continue;
      assert.ok(existsIn(dirs, span), `${span} exists in ${name} (ae.agents-md.paths-exist)`);
    }
  });
}

test("every placeholder path and file a site creates has the shape of a file in examples/minimal", () => {
  const files = listing(minimal);
  const creates = fences.find(({ info }) => info === "text").body.trim().split("\n").map((line) => line.split(/\s+/)[0]);
  for (const path of [...spans.filter((span) => looksLikePath(span) && placeholder.test(span)), ...creates]) {
    assert.ok(files.some((file) => shape(path).test(file)), `${path} matches a file in examples/minimal`);
  }
});

test("every schema link points at a file in this repository", () => {
  const links = [...source.matchAll(/https:\/\/(?:raw\.githubusercontent\.com\/arminazimi\/slipway\/main|github\.com\/arminazimi\/slipway\/tree\/main)\/(\S+)/g)];
  assert.ok(links.length >= 3);
  for (const [, path] of links) assert.ok(existsSync(join(root, path)), `${path} exists`);
});

test("every command in a sh block is one the site can run", () => {
  const gemfile = readFileSync(join(root, "Gemfile"), "utf8");
  const commands = {
    "bundle exec jekyll build": () => /gem ["']github-pages["']/.test(gemfile),
    "bundle exec jekyll serve": () => /gem ["']github-pages["']/.test(gemfile),
  };
  const lines = fences.filter(({ info }) => ["sh", "bash", "shell"].includes(info)).flatMap(({ body }) => body.trim().split("\n"));
  assert.ok(lines.length > 0);
  for (const line of lines) {
    assert.ok(line in commands, `${line} is a known command; add a check for it here`);
    assert.ok(commands[line](), `${line} works with this repository's Gemfile`);
  }
});

test("the front matter and navigation examples pass the schemas", () => {
  const pages = fences.filter(({ info }) => info === "markdown");
  assert.ok(pages.length >= 3);
  for (const { body } of pages) {
    const data = parse(frontMatter(body));
    const file = data.layout === "post" ? "_posts/2026-01-01-example.md" : "example.md";
    assert.deepEqual(validateFrontMatter(data, file), [], body);
  }
  const schema = JSON.parse(readFileSync(join(root, "schema/navigation.schema.json"), "utf8"));
  const validate = new Ajv2020({ allErrors: true }).compile(schema);
  const navigation = parse(fences.find(({ info }) => info === "yaml").body);
  assert.ok(validate(navigation), JSON.stringify(validate.errors));
});
