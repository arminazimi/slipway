import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { doctor } from "../src/doctor.mjs";
import { siteFiles, stubs } from "../src/checks/jekyll.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const fixture = here("fixtures/own-site-files");
const repo = here("../../../");
const stubFindings = (report) => report.findings.filter((f) => f.id === "jekyll.stubs");

test("a site that writes its own sitemap, llms, and robots files gets no stub finding", async () => {
  const report = await doctor(fixture);
  assert.deepEqual(stubFindings(report), []);
});

test("a site with neither the stub nor its own file still gets the existing finding", async () => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-own-site-files-"));
  const site = join(dir, "site");
  try {
    cpSync(fixture, site, { recursive: true });
    for (const name of ["search.json", "404.md"]) unlinkSync(join(site, name));
    const report = await doctor(site);
    assert.deepEqual(
      stubFindings(report).map((f) => f.file),
      ["404.md", "search.json"],
    );
    for (const finding of stubFindings(report)) {
      assert.equal(finding.severity, "warning", finding.file);
      assert.ok(finding.fix, `${finding.file} has no fix`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a generated file a site may own is never a required stub", () => {
  assert.deepEqual(siteFiles.filter((name) => stubs.includes(name)), []);
  for (const name of siteFiles) assert.match(name, /^[^/]+$/);
});

test("docs/site-files.md covers every file of the contract", () => {
  const doc = readFileSync(join(repo, "docs/site-files.md"), "utf8");
  for (const name of siteFiles) assert.ok(doc.includes(name), `${name} is not in docs/site-files.md`);
  for (const name of stubs) assert.ok(doc.includes(name), `${name} is not in docs/site-files.md`);
});
