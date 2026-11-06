import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { main, parseArgs } from "../src/commands/new.mjs";

const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const example = join(repoRoot, "examples", "minimal");

function context() {
  let stdout = "";
  let stderr = "";
  return {
    log: (msg) => { stdout += msg + "\n"; },
    error: (msg) => { stderr += msg + "\n"; },
    get stdout() { return stdout; },
    get stderr() { return stderr; }
  };
}

function site(t) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-new-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(example, dir, { recursive: true });
  return dir;
}

test("new --help documents every flag", async () => {
  const ctx = context();
  assert.equal(await main(["new", "--help"], ctx), 0);
  for (const flag of ["--title", "--lang", "--json"]) assert.match(ctx.stdout, new RegExp(flag));
});

test("new parseArgs errors", () => {
  assert.equal(parseArgs(["new"]).error, "missing <layout>");
  assert.equal(parseArgs(["new", "hero", "a.md", "--title", "A"]).error, "unknown layout: hero. supported: page, post, doc");
  assert.equal(parseArgs(["new", "page", "a.txt", "--title", "A"]).error, "path must end in .md: a.txt");
  assert.equal(parseArgs(["new", "page", "a.md"]).error, "missing --title <title>");
  assert.equal(parseArgs(["new", "page", "a.md", "--title", "A", "--nope"]).error, "unknown option: --nope");
});

test("new writes a page with the site's lang", async (t) => {
  const dir = site(t);
  const ctx = context();
  assert.equal(await main(["new", "page", join(dir, "team.md"), "--title", "About us"], ctx), 0);

  const content = readFileSync(join(dir, "team.md"), "utf8");
  assert.match(content, /^---\n/);
  assert.match(content, /title: About us\n/);
  assert.match(content, /layout: page\n/);
  assert.match(content, /lang: en\n/);
  assert.match(ctx.stdout, /created team\.md/);
});

test("new dates a post path and accepts --lang", async (t) => {
  const dir = site(t);
  const ctx = context();
  assert.equal(await main(["new", "post", join(dir, "_posts", "hello.md"), "--title", "Hello", "--lang", "fa"], ctx), 0);

  const files = readdirSync(join(dir, "_posts")).filter((file) => file.endsWith("-hello.md"));
  assert.equal(files.length, 1);
  assert.match(files[0], /^\d{4}-\d{2}-\d{2}-hello\.md$/);

  const content = readFileSync(join(dir, "_posts", files[0]), "utf8");
  assert.match(content, /title: Hello\n/);
  assert.match(content, /layout: post\n/);
  assert.match(content, /lang: fa\n/);
});

test("new --json reports the file", async (t) => {
  const dir = site(t);
  const ctx = context();
  assert.equal(await main(["new", "doc", join(dir, "docs", "guide.md"), "--title", "Guide", "--json"], ctx), 0);

  const out = JSON.parse(ctx.stdout);
  assert.deepEqual(out, { path: "docs/guide.md", layout: "doc", title: "Guide", lang: "en" });
  assert.ok(existsSync(join(dir, "docs", "guide.md")));
});

test("new refuses to overwrite and needs a site root", async (t) => {
  const dir = site(t);
  writeFileSync(join(dir, "team.md"), "keep me");

  let ctx = context();
  assert.equal(await main(["new", "page", join(dir, "team.md"), "--title", "About"], ctx), 1);
  assert.match(ctx.stderr, /file already exists: team.md/);
  assert.equal(readFileSync(join(dir, "team.md"), "utf8"), "keep me");

  const bare = mkdtempSync(join(tmpdir(), "slipway-new-bare-"));
  t.after(() => rmSync(bare, { recursive: true, force: true }));
  ctx = context();
  assert.equal(await main(["new", "page", join(bare, "about.md"), "--title", "About"], ctx), 1);
  assert.match(ctx.stderr, /no site root/);
  assert.ok(!existsSync(join(bare, "about.md")));
});
