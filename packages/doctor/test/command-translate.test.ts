import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { main, parseArgs } from "../src/commands/translate.ts";
import { splitFrontMatter } from "../src/yaml.ts";

const docsSite = fileURLToPath(new URL("../../../fixtures/docs-site", import.meta.url));

/** A copy of fixtures/docs-site with English and Persian configured and `install.md` translated. */
function engineSite(t) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-translate-engine-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(docsSite, dir, { recursive: true });
  const configPath = join(dir, "slipway.yml");
  writeFileSync(configPath, `${readFileSync(configPath, "utf8")}\nlanguages:\n  - { code: en, name: English, prefix: "" }\n  - { code: fa, name: Farsi, prefix: /fa }\n`);
  const install = join(dir, "install.md");
  writeFileSync(install, readFileSync(install, "utf8").replace("---\n", "---\ntranslation_key: install\n"));
  return dir;
}

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

test("translate follows the engine's language prefixes on fixtures/docs-site", async (t) => {
  const dir = engineSite(t);

  const ctx = getContext();
  const code = await main(["translate", join(dir, "install.md"), "--to", "fa", "--json"], ctx);
  assert.equal(code, 0);

  const out = JSON.parse(ctx.stdout);
  assert.equal(out.source, "install.md");
  assert.equal(out.target, "fa/install.md");
  assert.equal(out.lang, "fa");
  assert.equal(out.translation_key, "install");

  const target = readFileSync(join(dir, "fa", "install.md"), "utf8");
  const block = splitFrontMatter(target);
  assert.ok(block);
  assert.ok(block.text.includes("lang: fa"));
  assert.ok(block.text.includes("translation_key: install"));
  assert.ok(target.includes("# Install"));
});

test("translate reads lang from a language prefix and moves a permalink with it", async (t) => {
  const dir = engineSite(t);
  mkdirSync(join(dir, "fa"));
  writeFileSync(join(dir, "fa", "guide.md"), `---\ntitle: Guide\ntranslation_key: guide\npermalink: /fa/guide/\n---\n\nBody.\n`);

  const ctx = getContext();
  const code = await main(["translate", join(dir, "fa", "guide.md"), "--to", "en"], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /Translated fa\/guide\.md to guide\.md for language en/);

  const target = readFileSync(join(dir, "guide.md"), "utf8");
  const block = splitFrontMatter(target);
  assert.ok(block);
  assert.ok(block.text.includes("lang: en"));
  assert.ok(block.text.includes("permalink: /guide/"));
  assert.ok(!block.text.includes("lang: fa"));
});

test("translate rejects a language the engine config does not list", async (t) => {
  const dir = engineSite(t);

  const ctx = getContext();
  const code = await main(["translate", join(dir, "install.md"), "--to", "de"], ctx);
  assert.equal(code, 1);
  assert.match(ctx.stderr, /de is not in languages in slipway\.yml/);
  assert.ok(!existsSync(join(dir, "de")));
});
