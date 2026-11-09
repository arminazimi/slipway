import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { createSite, main, parseOptions, parseRepository, siteConfig, UsageError } from "../src/cli.mjs";
import { bundledSources, copySources, repoSources, schemaPaths, templatePages } from "../src/sources.mjs";

const bin = fileURLToPath(new URL("../bin/create-slipway.mjs", import.meta.url));
const engine = fileURLToPath(new URL("../../engine/bin/slipway.ts", import.meta.url));
const fixture = fileURLToPath(new URL("../../../fixtures/docs-site", import.meta.url));
const work = mkdtempSync(join(realpathSync(tmpdir()), "create-slipway-"));
after(() => rmSync(work, { recursive: true, force: true }));

/** Runs the real binary with stdin from a pipe, so it has no terminal. */
function run(args) {
  return spawnSync(process.execPath, [bin, ...args], { cwd: work, encoding: "utf8", input: "", timeout: 10_000 });
}

/** A stdin stream that claims to be a terminal and answers the prompts in order. */
function terminal(answers) {
  const input = new PassThrough();
  input.isTTY = true;
  input.end(answers.map((a) => `${a}\n`).join(""));
  return input;
}

function sink() {
  const stream = new PassThrough();
  let text = "";
  stream.on("data", (chunk) => (text += chunk));
  return { stream, text: () => text };
}

/** Copies the fixture without a build cache another test may be writing into it. */
function copyFixture() {
  const site = join(work, "fixture-site");
  const transient = new Set([".slipway", ".tmp", "node_modules", ".git"]);
  cpSync(fixture, site, {
    recursive: true,
    filter: (source) => !source.split(/[\\/]/).some((part) => transient.has(part)),
  });
  return site;
}

/** Builds `site` with the engine's real CLI. */
function build(site, out) {
  return spawnSync(process.execPath, [engine, "build", site, "--out", out], { encoding: "utf8", timeout: 120_000 });
}

test("flags alone create a docs site without prompting", () => {
  const result = run(["demo", "--title", "Demo Docs", "--repository", "arminazimi/demo", "--lang", "fa", "--yes"]);
  assert.equal(result.status, 0, result.stderr);
  const site = join(work, "demo");
  const config = parse(readFileSync(join(site, "mizzen.yml"), "utf8"));
  assert.deepEqual(config, {
    title: "Demo Docs",
    lang: "fa",
    source: "docs",
    url: "https://arminazimi.github.io",
    base: "/demo",
    defaults: [{ path: "", values: { layout: "doc" } }],
    repository: { url: "https://github.com/arminazimi/demo" },
  });
  for (const path of [
    "docs/index.md",
    "docs/quickstart.md",
    "docs/configuration.md",
    ".github/workflows/deploy.yml",
    "content-schemas.json",
    ...schemaPaths(),
  ]) {
    assert.ok(existsSync(join(site, path)), path);
  }
  const schemas = JSON.parse(readFileSync(join(site, "content-schemas.json"), "utf8"));
  assert.deepEqual(schemas, {
    version: "0.1",
    schemas: [
      { files: ["mizzen.yml"], target: "file", schema: "schema/config.schema.json" },
      { files: ["docs/**/*.md", "docs/**/*.markdown"], target: "front-matter", schema: "schema/front-matter/base.schema.json" },
    ],
  });
  assert.match(result.stdout, /GitHub Actions/);
});

test("the template has exactly three sample pages", () => {
  assert.deepEqual(Object.keys(templatePages()).sort(), ["docs/configuration.md", "docs/index.md", "docs/quickstart.md"]);
});

test("without a terminal it never prompts and uses the defaults", () => {
  const result = run(["Quiet Site"]);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /\?|: $/m);
  const config = parse(readFileSync(join(work, "Quiet Site", "mizzen.yml"), "utf8"));
  assert.equal(config.title, "Quiet Site");
  assert.equal(config.lang, "en");
  assert.equal(config.source, "docs");
  assert.equal(config.repository, undefined);
  assert.equal(config.url, undefined);
});

test("without a terminal and without a folder it fails with usage instead of prompting", () => {
  const result = run(["--title", "T"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /name a folder/);
});

test("a non-empty folder is refused with exit code 2 and left alone", () => {
  const dir = join(work, "taken");
  mkdirSync(dir);
  writeFileSync(join(dir, "notes.txt"), "keep me");
  const result = run(["taken", "--yes"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /not empty/);
  assert.deepEqual(readdirSync(dir), ["notes.txt"]);
});

test("a folder holding only .git counts as empty", () => {
  mkdirSync(join(work, "cloned", ".git"), { recursive: true });
  assert.equal(run(["cloned", "--yes"]).status, 0);
});

test("bad flags fail with exit code 1", () => {
  assert.equal(run(["x", "--mode", "docs"]).status, 1);
  assert.equal(run(["x", "--lang", "Persian"]).status, 1);
  assert.equal(run(["x", "--repository", "nope"]).status, 1);
  assert.equal(run(["x", "--title", ""]).status, 1);
  assert.equal(run(["x", "--colour"]).status, 1);
  assert.equal(run(["a", "b"]).status, 1);
  assert.equal(existsSync(join(work, "x")), false);
});

test("repository values are normalized and a user site keeps the domain root", () => {
  assert.deepEqual(parseRepository("arminazimi/demo"), { url: "https://github.com/arminazimi/demo", owner: "arminazimi", name: "demo" });
  assert.deepEqual(parseRepository("https://github.com/arminazimi/demo.git"), { url: "https://github.com/arminazimi/demo", owner: "arminazimi", name: "demo" });
  assert.deepEqual(parseRepository("https://github.com/arminazimi/arminazimi.github.io"), { url: "https://github.com/arminazimi/arminazimi.github.io", owner: "arminazimi", name: "arminazimi.github.io" });
  assert.throws(() => parseRepository("nope"), UsageError);
  assert.throws(() => parseRepository("https://github.com/only-owner"), UsageError);

  const config = parse(siteConfig({ title: "T", lang: "en", repository: parseRepository("arminazimi/arminazimi.github.io") }));
  assert.equal(config.url, "https://arminazimi.github.io");
  assert.equal(config.base, "");
});

test("with a terminal it prompts only for the missing values", async () => {
  const out = sink();
  const code = await main(["prompted", "--lang", "de"], { stdin: terminal(["My Title", "arminazimi/prompted"]), stdout: out.stream, stderr: out.stream, cwd: work });
  assert.equal(code, 0, out.text());
  assert.match(out.text(), /Site title/);
  assert.match(out.text(), /Repository/);
  assert.doesNotMatch(out.text(), /Folder|Language code/);
  const config = parse(readFileSync(join(work, "prompted", "mizzen.yml"), "utf8"));
  assert.equal(config.title, "My Title");
  assert.equal(config.lang, "de");
  assert.equal(config.base, "/prompted");
  assert.deepEqual(config.repository, { url: "https://github.com/arminazimi/prompted" });
});

test("an empty answer to the repository prompt leaves the key out", async () => {
  const out = sink();
  const code = await main(["no-repo"], { stdin: terminal(["No Repo", ""]), stdout: out.stream, stderr: out.stream, cwd: work });
  assert.equal(code, 0, out.text());
  const config = parse(readFileSync(join(work, "no-repo", "mizzen.yml"), "utf8"));
  assert.equal(config.title, "No Repo");
  assert.equal(config.repository, undefined);
  assert.equal(config.url, undefined);
});

test("--yes skips the prompts even on a terminal", async () => {
  const out = sink();
  const code = await main(["yes-site", "--yes"], { stdin: terminal([]), stdout: out.stream, stderr: out.stream, cwd: work });
  assert.equal(code, 0, out.text());
  assert.doesNotMatch(out.text(), /Site title/);
});

test("titles with YAML syntax survive the round trip", () => {
  for (const title of ['Ali: "notes" # 1', "اسلیپ‌وی", "- yes", "{x}"]) {
    assert.equal(parse(siteConfig({ title, lang: "en" })).title, title);
  }
});

test("parseOptions reads the docs template's flags", () => {
  assert.deepEqual(parseOptions(["site", "--title", "T", "--repository", "a/b", "--lang", "fa", "--yes"]), {
    dir: "site",
    title: "T",
    repository: "a/b",
    lang: "fa",
    yes: true,
    help: false,
    version: false,
  });
});

test("the generated site builds with the engine", () => {
  assert.equal(run(["built", "--title", "Built", "--repository", "arminazimi/built", "--yes"]).status, 0);
  const out = join(work, "built-out");
  const result = build(join(work, "built"), out);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  for (const page of ["index.html", "quickstart/index.html", "configuration/index.html"]) {
    assert.ok(existsSync(join(out, page)), page);
  }
  assert.match(readFileSync(join(out, "quickstart/index.html"), "utf8"), /Quickstart/);
  assert.ok(existsSync(join(out, "sitemap.xml")), "the config's url gives the site a sitemap");
});

test("fixtures/docs-site builds with the same engine", () => {
  const out = join(work, "fixture-out");
  const result = build(copyFixture(), out);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(existsSync(join(out, "quickstart/index.html")));
});

test("the packed template carries the schemas and makes the same site", () => {
  const packed = join(work, "packed");
  copySources(repoSources(), packed);
  for (const path of schemaPaths()) assert.ok(existsSync(join(packed, path)), path);

  const site = join(work, "packed-site");
  createSite({ dir: site, title: "Packed", lang: "en", repository: parseRepository("arminazimi/packed") }, bundledSources(packed));
  for (const path of ["mizzen.yml", "docs/index.md", ...schemaPaths()]) assert.ok(existsSync(join(site, path)), path);
});
