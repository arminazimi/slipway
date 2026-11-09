import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/checks/lang-mismatch.ts";
import { Site } from "../src/site.ts";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);
const docsSite = here("../../../fixtures/docs-site");

/** An empty temporary folder, removed after the test. */
function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-lang-mismatch-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** A build folder with a manifest page per entry and a built HTML page that declares its language. */
function buildWith(t, entries) {
  const build = tempDir(t);
  mkdirSync(join(build, ".slipway"), { recursive: true });
  const pages = entries.map(({ source, lang }) => {
    const output = `${source.replace(/\.md$/, "")}/index.html`;
    const full = join(build, ...output.split("/"));
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, `<!doctype html>\n<html lang="${lang}">\n<body></body>\n</html>\n`);
    return {
      url: `/${output.replace(/\/index\.html$/, "/")}`,
      source,
      title: source,
      layout: null,
      outputs: [output],
      hashes: { source: "a".repeat(64), html: "b".repeat(64) },
    };
  });
  writeFileSync(join(build, ".slipway/manifest.json"), JSON.stringify({ version: 1, pages }));
  return build;
}

const persian = "این یک صفحه فارسی است که زبان آن باید از پیشوند نشانی صفحه خوانده شود. متن باید به اندازه کافی طولانی باشد تا از حد دویست حرف عبور کند. بنابراین من به نوشتن ادامه می‌دهم تا مطمئن شوم که تعداد حروف از دویست بیشتر می‌شود. هنوز هم باید بیشتر بنویسم. فکر کنم الان کافی باشد. این یک تست است.";

test("lang-mismatch warns when page text script differs from its lang", async () => {
  const site = new Site(fixture("lang-mismatch"));
  const { status, findings } = await run(site);
  assert.equal(status, "fail");
  assert.equal(findings.length, 2);

  const explicitFinding = findings.find(f => f.file === "pages/fa-explicit.md");
  assert.ok(explicitFinding);
  assert.equal(explicitFinding.line, 3);
  assert.match(explicitFinding.message, /dominant script is Arabic/);

  const implicitFinding = findings.find(f => f.file === "pages/fa-mismatch.md");
  assert.ok(implicitFinding);
  assert.equal(implicitFinding.line, undefined);
  assert.match(implicitFinding.message, /dominant script is Arabic/);
});

test("lang-mismatch reads the page language from the built page the manifest names", async (t) => {
  const build = buildWith(t, [
    { source: "quickstart.md", lang: "fa" },
    { source: "install.md", lang: "en" },
  ]);
  const { status, findings } = await run(new Site(docsSite, { build }));
  assert.equal(status, "fail");
  assert.deepEqual(findings.map((finding) => finding.file), ["quickstart.md"]);
  assert.match(findings[0].message, /dominant script is Latin/);
});

test("lang-mismatch reads an engine site's language and URL prefixes without a build", async (t) => {
  const source = tempDir(t);
  writeFileSync(join(source, "slipway.yml"), "title: Test\nlang: en\nlanguages:\n  - code: fa\n    name: Persian\n    prefix: /fa\n");
  mkdirSync(join(source, "fa"));
  writeFileSync(join(source, "fa/page.md"), persian);

  const { status, findings } = await run(new Site(source));
  assert.equal(status, "pass");
  assert.deepEqual(findings, []);
});

test("lang-mismatch is silent on examples", async () => {
  for (const name of ["bare", "minimal", "docs", "blog", "persian"]) {
    const siteDir = join(repo, "packages/doctor/test/fixtures/examples", name);
    const site = new Site(siteDir);
    const { status, findings } = await run(site);
    assert.equal(status, "pass");
    assert.deepEqual(findings, []);
  }
});
