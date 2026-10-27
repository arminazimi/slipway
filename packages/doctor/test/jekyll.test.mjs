import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { doctor } from "../src/doctor.mjs";
import { builtinKeys, checks, stubs } from "../src/checks/jekyll.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);
const jekyllFindings = (report) => report.findings.filter((f) => f.scope === "jekyll" || f.id.startsWith("jekyll."));
const ids = Object.keys(checks);

/** Every file under `dir`, dot-folders included, as forward-slash paths. */
const walk = (dir, base = "") =>
  readdirSync(join(dir, base), { withFileTypes: true }).flatMap((entry) => {
    const path = base ? `${base}/${entry.name}` : entry.name;
    return entry.isDirectory() ? walk(dir, path) : [path];
  });

test("the passing fixture and examples/minimal run every Jekyll check with no findings", async () => {
  for (const dir of [fixture("jekyll-pass"), join(repo, "examples/minimal")]) {
    const report = await doctor(dir);
    const results = report.tests.filter((t) => t.scope === "jekyll");
    assert.deepEqual(results.map((t) => t.id), ids, dir);
    assert.deepEqual(jekyllFindings(report), [], dir);
  }
});

test("each failing fixture gives exactly one warning with file, line, and fix", async () => {
  const deprecations = JSON.parse(readFileSync(join(fixture("jekyll-deprecated"), "deprecations.json"), "utf8")).deprecations;
  const expected = {
    "jekyll-stubs": { id: "jekyll.stubs", file: "AGENTS.md", line: undefined },
    "jekyll-deprecated": { id: "jekyll.deprecated", file: "fa/index.md", line: 5 },
    "jekyll-liquid": { id: "jekyll.liquid-in-content", file: "index.md", line: 9 },
    "jekyll-translation": { id: "jekyll.translation-pair", file: "index.md", line: 4 },
    "jekyll-ui-strings": { id: "jekyll.ui-strings", file: "_data/i18n/fa.yml", line: 2 },
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
  const fail = await doctor(fixture("jekyll-liquid"));
  assert.equal(fail.level, pass.level);
  assert.deepEqual(
    fail.tests.filter((t) => t.status === "fail" && t.scope !== "jekyll").map((t) => t.id),
    pass.tests.filter((t) => t.status === "fail" && t.scope !== "jekyll").map((t) => t.id),
  );
});

test("a site without _config.yml gets no Jekyll checks", async () => {
  const report = await doctor(fixture("conforming"), { build: join(fixture("conforming"), "build") });
  assert.deepEqual(report.tests.filter((t) => t.scope === "jekyll"), []);
});

test("the stubs are the files of starter-files/ except its README", () => {
  assert.deepEqual(walk(join(repo, "starter-files")).filter((path) => path !== "README.md").sort(), [...stubs].sort());
});

test("the built-in UI string keys are the ones in _includes/i18n-builtin.html", () => {
  const html = readFileSync(join(repo, "_includes/i18n/en.html"), "utf8");
  const keys = [...new Set([...html.matchAll(/when '([a-z_]+)'/g)].map((m) => m[1]))];
  assert.deepEqual([...builtinKeys].sort(), keys.sort());
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
