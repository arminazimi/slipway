import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/checks/i18n.zwnj.ts";
import { Site } from "../src/site.ts";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);
const docsSite = here("../../../fixtures/docs-site");

/** An empty temporary folder, removed after the test. */
function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-i18n-zwnj-"));
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

test("i18n.zwnj reports missing joiners on prefixes, suffixes, and plurals", async () => {
  const site = new Site(fixture("i18n-zwnj"));
  const { status, findings } = await run(site);

  assert.equal(status, "fail");
  assert.deepEqual(
    findings.map(({ file, line, column, fix }) => ({ file, line, column, fix })),
    [
      { file: "page.md", line: 5, column: 1, fix: "می‌خواهم به خانه بروم." },
      { file: "page.md", line: 6, column: 1, fix: "نمی‌خواهم دیر برسم." },
      { file: "page.md", line: 7, column: 6, fix: "کتاب‌ها روی میز است." },
    ],
  );
  assert.match(findings[0].message, /as its own word/);
  assert.match(findings[2].message, /as its own word/);
});

test("i18n.zwnj reads each page's language from the built page the manifest names", async (t) => {
  const persian = buildWith(t, [{ source: "page.md", lang: "fa" }]);
  const reported = await run(new Site(fixture("i18n-zwnj"), { build: persian }));
  assert.equal(reported.status, "fail");
  assert.equal(reported.findings.length, 3);

  const english = buildWith(t, [{ source: "page.md", lang: "en" }]);
  const skipped = await run(new Site(fixture("i18n-zwnj"), { build: english }));
  assert.equal(skipped.status, "pass");
  assert.deepEqual(skipped.findings, []);
});

test("i18n.zwnj skips the English pages of an engine site", async () => {
  const { status, findings } = await run(new Site(docsSite));
  assert.equal(status, "pass");
  assert.deepEqual(findings, []);
});

test("i18n.zwnj ignores inline code and fenced code", async () => {
  const site = new Site(fixture("i18n-zwnj"));
  const { findings } = await run(site);
  assert.equal(findings.some((finding) => finding.line >= 11), false);
});

test("i18n.zwnj is silent on examples", async () => {
  for (const name of ["bare", "minimal", "docs", "blog", "persian"]) {
    const site = new Site(join(repo, "packages/doctor/test/fixtures/examples", name));
    const { status, findings } = await run(site);
    assert.equal(status, "pass", `${name} failed with findings: ${JSON.stringify(findings)}`);
    assert.deepEqual(findings, []);
  }
});
