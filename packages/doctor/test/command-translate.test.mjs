import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main, parseArgs } from "../src/commands/translate.mjs";
import { splitFrontMatter } from "../src/yaml.mjs";

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

test("translate --help", async () => {
  const ctx = getContext();
  const code = await main(["translate", "--help"], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /Usage: slipway translate/);
});

test("parseArgs", () => {
  assert.equal(parseArgs(["translate"]).error, "missing <source-page>");
  assert.equal(parseArgs(["translate", "x"]).error, "missing --to <lang>");
  assert.equal(parseArgs(["translate", "x", "--to"]).error, "--to needs a value");
  assert.equal(parseArgs(["translate", "x", "--to", "fa", "--unknown"]).error, "unknown option: --unknown");
});

test("translate command fails if source does not exist", async (t) => {
  const ctx = getContext();
  const code = await main(["translate", "nonexistent.md", "--to", "fa"], ctx);
  assert.equal(code, 1);
  assert.match(ctx.stderr, /source file does not exist/);
});

test("translate copies the file with updated lang and preserves translation_key", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-translate-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  writeFileSync(join(dir, "_config.yml"), `
title: Test
lang: en
slipway:
  languages:
    - { code: en, name: English, prefix: "" }
    - { code: fa, name: Farsi, prefix: /fa }
`);

  const sourceFile = join(dir, "about.md");
  writeFileSync(sourceFile, `---\ntitle: About\nlang: en\ntranslation_key: about_us\n---\n\nContent here.\n`);

  const ctx = getContext();
  const code = await main(["translate", sourceFile, "--to", "fa"], ctx);

  assert.equal(code, 0);
  assert.match(ctx.stdout, /Translated about.md to fa[/\\]about.md for language fa/);

  const targetFile = join(dir, "fa", "about.md");
  assert.ok(existsSync(targetFile));

  const targetContent = readFileSync(targetFile, "utf8");
  const block = splitFrontMatter(targetContent);
  assert.ok(block);
  assert.ok(block.text.includes("lang: fa"));
  assert.ok(block.text.includes("translation_key: about_us"));
  assert.ok(targetContent.includes("Content here."));
});

test("translate handles json output", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-translate-json-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  writeFileSync(join(dir, "_config.yml"), `
title: Test
lang: en
slipway:
  languages:
    - { code: en, name: English, prefix: "" }
    - { code: fa, name: Farsi, prefix: /fa }
`);

  const sourceFile = join(dir, "about.md");
  writeFileSync(sourceFile, `---\ntitle: About\nlang: en\ntranslation_key: about_us\n---\n\nContent here.\n`);

  const ctx = getContext();
  const code = await main(["translate", sourceFile, "--to", "fa", "--json"], ctx);

  assert.equal(code, 0);
  const out = JSON.parse(ctx.stdout);
  assert.equal(out.source, "about.md");
  assert.ok(out.target === "fa/about.md" || out.target === "fa\\about.md");
  assert.equal(out.lang, "fa");
  assert.equal(out.translation_key, "about_us");
});

test("translate fails if target file already exists", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-translate-exists-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  writeFileSync(join(dir, "_config.yml"), `
title: Test
lang: en
slipway:
  languages:
    - { code: en, name: English, prefix: "" }
    - { code: fa, name: Farsi, prefix: /fa }
`);

  const sourceFile = join(dir, "about.md");
  writeFileSync(sourceFile, `---\ntitle: About\ntranslation_key: about\n---\n`);

  mkdirSync(join(dir, "fa"));
  writeFileSync(join(dir, "fa", "about.md"), `---\ntitle: About\n---\n`);

  const ctx = getContext();
  const code = await main(["translate", sourceFile, "--to", "fa"], ctx);

  assert.equal(code, 1);
  assert.match(ctx.stderr, /target file already exists/);
});

test("translate fails if translation_key is missing", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-translate-nokey-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  writeFileSync(join(dir, "_config.yml"), `title: Test\n`);
  const sourceFile = join(dir, "about.md");
  writeFileSync(sourceFile, `---\ntitle: About\n---\n`);

  const ctx = getContext();
  const code = await main(["translate", sourceFile, "--to", "fa"], ctx);

  assert.equal(code, 1);
  assert.match(ctx.stderr, /source page is missing translation_key/);
});
