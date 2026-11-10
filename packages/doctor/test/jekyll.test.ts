import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { doctor } from "../src/doctor.ts";
import { checks, stubs } from "../src/checks/jekyll.ts";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);
const jekyllFindings = (report) => report.findings.filter((f) => f.scope === "jekyll" || f.id.startsWith("jekyll.") || f.id === "config.deprecated");
const ids = Object.keys(checks);

/** Every file under `dir`, dot-folders included, as forward-slash paths. */
const walk = (dir, base = "") =>
  readdirSync(join(dir, base), { withFileTypes: true }).flatMap((entry) => {
    const path = base ? `${base}/${entry.name}` : entry.name;
    return entry.isDirectory() ? walk(dir, path) : [path];
  });

test("the passing fixture runs every Jekyll check with no findings", async () => {
  const dir = fixture("jekyll-pass");
  const report = await doctor(dir);
  const results = report.tests.filter((t) => t.scope === "jekyll");
  assert.deepEqual(results.map((t) => t.id), ids, dir);
  assert.deepEqual(jekyllFindings(report), [], dir);
});

test("each failing fixture gives exactly one warning with file, line, and fix", async () => {
  const deprecations = JSON.parse(readFileSync(join(fixture("jekyll-deprecated"), "deprecations.json"), "utf8")).deprecations;
  const expected = {
    "jekyll-stubs": { id: "jekyll.stubs", file: "AGENTS.md", line: undefined },
    "jekyll-deprecated": { id: "config.deprecated", file: "fa/index.md", line: 5 },
    "jekyll-translation": { id: "jekyll.translation-pair", file: "index.md", line: 4 },
  };
  for (const [name, want] of Object.entries(expected)) {
    const report = await doctor(fixture(name), { deprecations });
    const found = jekyllFindings(report);
    assert.equal(found.length, 1, `${name}: ${JSON.stringify(found)}`);
    const [finding] = found;
    assert.deepEqual({ id: finding.id, file: finding.file, line: finding.line }, want, name);
    assert.equal(finding.severity, "warning", name);
    assert.ok(finding.fix, `${name} has no fix`);
  }
});

test("Jekyll checks are warnings: the level and the exit code do not change", async () => {
  const pass = await doctor(fixture("jekyll-pass"));
  const fail = await doctor(fixture("jekyll-translation"));
  assert.equal(fail.level, pass.level);
  assert.deepEqual(
    fail.tests.filter((t) => t.status === "fail" && t.scope !== "jekyll").map((t) => t.id),
    pass.tests.filter((t) => t.status === "fail" && t.scope !== "jekyll").map((t) => t.id),
  );
});

test("a site without an engine config gets no site checks", async () => {
  const report = await doctor(fixture("conforming"), { build: join(fixture("conforming"), "build") });
  assert.deepEqual(report.tests.filter((t) => t.scope === "jekyll"), []);
});

test("the config check reads slipway.yml with its line, and the old id still resolves", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-jekyll-config-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, "slipway.yml"), 'title: Beacon\nbase: ""\n');

  const deprecations = [{ kind: "config", old: "base", new: "baseurl", since: "0.3.0", removed_in: "0.4.0" }];
  const report = await doctor(dir, { deprecations });
  assert.deepEqual(
    report.findings
      .filter((finding) => finding.id === "config.deprecated")
      .map(({ file, line, key, old, new: replacement }) => ({ file, line, key, old, new: replacement })),
    [{ file: "slipway.yml", line: 2, key: "base", old: "base", new: "baseurl" }],
  );

  assert.equal(checks["jekyll.deprecated"], checks["config.deprecated"]);
  assert.ok(!Object.keys(checks).includes("jekyll.deprecated"));
});

test("the stubs are the files of starter-files/ except its READMEs and optional files", () => {
  const isOptional = (path) => path === "README.md" || path.startsWith("optional/");
  assert.deepEqual(walk(join(repo, "starter-files")).filter((path) => !isOptional(path)).sort(), [...stubs].sort());
});

test("the packaged deprecations list matches the repository's", () => {
  assert.equal(
    readFileSync(here("../schema/deprecations.json"), "utf8"),
    readFileSync(join(repo, "schema/deprecations.json"), "utf8"),
    "packages/doctor/schema/deprecations.json is stale: copy schema/deprecations.json",
  );
});

test("every check id is listed in the README", () => {
  const readme = readFileSync(here("../README.md"), "utf8");
  for (const id of ids) assert.ok(readme.includes(`\`${id}\``), `${id} is not in the README`);
});
