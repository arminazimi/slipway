import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main, parseArgs } from "../src/commands/nav.mjs";

function getContext() {
  let stdout = "";
  let stderr = "";
  return {
    log: (msg) => { stdout += msg + "\n"; },
    error: (msg) => { stderr += msg + "\n"; },
    get stdout() { return stdout; },
    get stderr() { return stderr; }
  };
}

test("nav --help", async () => {
  const ctx = getContext();
  const code = await main(["nav", "--help"], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /Usage: slipway nav/);
});

test("nav parseArgs", () => {
  assert.equal(parseArgs(["nav", "x", "--format"]).error, "unknown option: --format");
  assert.equal(parseArgs(["nav"]).error, "missing <source-dir>");
  assert.equal(parseArgs(["nav", "src", "--add", "main"]).error, "--add needs --title");
  assert.equal(parseArgs(["nav", "src", "--add", "main", "--title", "t"]).error, "--add needs --url");
  assert.equal(parseArgs(["nav", "src", "--remove", "main"]).error, "--remove needs --url");
  assert.equal(parseArgs(["nav", "src", "--add", "main", "--remove", "main"]).error, "cannot use both --add and --remove");
});

test("nav check on existing file", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-nav-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "_data"));
  writeFileSync(join(dir, "_data/navigation.yml"), "# yaml-language-server: $schema=../../schema/navigation.schema.json\nmain:\n  - title: Home\n    url: /\n");

  const ctx = getContext();
  const code = await main(["nav", dir], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /navigation is valid/);
});

test("nav add item", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-nav-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "_data"));
  writeFileSync(join(dir, "_data/navigation.yml"), "# yaml-language-server: $schema=../../schema/navigation.schema.json\nmain:\n  - title: Home\n    url: /\n");

  const ctx = getContext();
  const code = await main(["nav", dir, "--add", "main", "--title", "About", "--url", "/about"], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /navigation updated/);
  const content = readFileSync(join(dir, "_data/navigation.yml"), "utf8");
  assert.match(content, /- title: About\n    url: \/about/);
  assert.match(content, /# yaml-language-server:/); // preserved comment
});

test("nav add item --json", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-nav-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "_data"));
  writeFileSync(join(dir, "_data/navigation.yml"), "# yaml-language-server: $schema=../../schema/navigation.schema.json\nmain:\n  - title: Home\n    url: /\n");

  const ctx = getContext();
  const code = await main(["nav", dir, "--add", "main", "--title", "About", "--url", "/about", "--json"], ctx);
  assert.equal(code, 0);
  const result = JSON.parse(ctx.stdout);
  assert.equal(result.success, true);
  assert.equal(result.modified, true);
});

test("nav remove item", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-nav-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "_data"));
  writeFileSync(join(dir, "_data/navigation.yml"), "# yaml-language-server: $schema=../../schema/navigation.schema.json\nmain:\n  - title: Home\n    url: /\n");

  const ctx = getContext();
  const code = await main(["nav", dir, "--remove", "main", "--url", "/"], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /navigation updated/);
  const content = readFileSync(join(dir, "_data/navigation.yml"), "utf8");
  assert.doesNotMatch(content, /- title: Home/);
});

test("nav add item with parent", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-nav-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "_data"));
  writeFileSync(join(dir, "_data/navigation.yml"), "# yaml-language-server: $schema=../../schema/navigation.schema.json\nmain:\n  - title: Home\n    url: /\n");

  const ctx = getContext();
  const code = await main(["nav", dir, "--add", "main", "--title", "Blog", "--url", "/blog", "--parent", "More"], ctx);
  assert.equal(code, 0);
  const content = readFileSync(join(dir, "_data/navigation.yml"), "utf8");
  assert.match(content, /title: More/);
  assert.match(content, /children:/);
  assert.match(content, /url: \/blog/);
});

test("nav invalid schema fails check", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-nav-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "_data"));
  writeFileSync(join(dir, "_data/navigation.yml"), "main:\n  - bad: 1\n");

  const ctx = getContext();
  const code = await main(["nav", dir, "--json"], ctx);
  assert.equal(code, 1);
  const result = JSON.parse(ctx.stdout);
  assert.match(result.error, /schema validation failed/);
});
