import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { builtSite } from "../../../tools/fixture-build/build.ts";
import { Ajv2020 } from "ajv/dist/2020.js";
import { id, run } from "../src/checks/sourcemap-fresh.ts";
import { doctor, loadTests } from "../src/doctor.ts";
import { toSarif } from "../src/report.ts";
import { Site } from "../src/site.ts";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);
const docsSite = here("../../../fixtures/docs-site");

test("sourcemap-fresh fires on broken fixture", async () => {
  const site = new Site(fixture("sourcemap-fresh"));
  const { status, findings } = await run(site);

  assert.equal(status, "fail");
  assert.deepEqual(
    findings.map(({ file, line }) => ({ file, line })),
    [
      { file: "moved.md", line: 5 },
      { file: "moved.md", line: 9 },
    ],
  );
  assert.match(findings[0].message, /records line 2/);
  assert.match(findings[1].message, /records line 6/);
  assert.ok(findings.every((finding) => finding.in === "source" && finding.fix));
});

test("sourcemap-fresh is silent on examples", async () => {
  for (const name of ["bare", "minimal", "docs", "blog", "persian"]) {
    const siteDir = join(repo, "examples", name);
    const site = new Site(siteDir);
    const { status, findings } = await run(site);
    assert.equal(status, "pass", `${name} failed with findings: ${JSON.stringify(findings)}`);
    assert.deepEqual(findings, []);
  }
});

test("sourcemap-fresh passes on the engine build of fixtures/docs-site", async () => {
  const build = await builtSite("docs-site");
  const site = new Site(docsSite, { build });
  const { status, findings } = await run(site);
  assert.equal(status, "pass", JSON.stringify(findings));
  assert.deepEqual(findings, []);
});

test("sourcemap-fresh reports a moved heading in the engine's output map", async (t) => {
  const build = mkdtempSync(join(tmpdir(), "slipway-sourcemap-fresh-"));
  t.after(() => rmSync(build, { recursive: true, force: true }));
  const map = JSON.parse(readFileSync(join(await builtSite("docs-site"), "sourcemap.json"), "utf8"));
  const page = map.pages.find((entry) => entry.source === "index.md");
  const section = page.sections.find((entry) => entry.text === "Get started");
  const actual = section.line;
  section.line = 1;
  writeFileSync(join(build, "sourcemap.json"), JSON.stringify(map));

  const site = new Site(docsSite, { build });
  const { status, findings } = await run(site);
  assert.equal(status, "fail");
  const moved = findings.find((finding) => finding.file === "index.md" && finding.line === actual);
  assert.ok(moved, JSON.stringify(findings));
  assert.match(moved.message, /records line 1/);
});

test("sourcemap-fresh reports an engine source edited after the build", async (t) => {
  const build = mkdtempSync(join(tmpdir(), "slipway-sourcemap-fresh-"));
  t.after(() => rmSync(build, { recursive: true, force: true }));
  const output = await builtSite("docs-site");
  writeFileSync(join(build, "sourcemap.json"), readFileSync(join(output, "sourcemap.json")));
  const real = JSON.parse(readFileSync(join(output, ".slipway/manifest.json"), "utf8"));
  const page = real.pages.find((entry) => entry.source === "index.md");
  mkdirSync(join(build, ".slipway"), { recursive: true });
  writeFileSync(
    join(build, ".slipway/manifest.json"),
    JSON.stringify({ version: 1, pages: [{ ...page, hashes: { source: "a".repeat(64), html: page.hashes.html } }] }),
  );

  const site = new Site(docsSite, { build });
  const { status, findings } = await run(site);
  assert.equal(status, "fail");
  assert.deepEqual(findings.map(({ file, line }) => ({ file, line })), [{ file: "index.md", line: 1 }]);
  assert.match(findings[0].message, /changed after the build/);
});


/** The doctor's tests with this check added, the way a generator check runs: a warning, no level. */
function testsWith() {
  const tests = loadTests();
  return {
    ...tests,
    tests: [...tests.tests, { id, level: null, keyword: null, scope: "doctor", how: "automated", description: "Every source map line still holds its heading." }],
  };
}

test("the JSON and the SARIF output carry the file and the line", async () => {
  const dir = fixture("sourcemap-fresh");
  const report = await doctor(dir, { tests: testsWith() });
  const plain = await doctor(dir);

  // The check is a warning: it never changes the level the site reaches.
  assert.equal(report.level, plain.level);

  const finding = report.findings.find((f) => f.id === id);
  assert.ok(finding, "the report has a finding for the check");
  assert.equal(finding.severity, "warning");
  assert.deepEqual([finding.in, finding.file, finding.line], ["source", "moved.md", 5]);

  // The JSON report is the report schema's shape.
  const schema = JSON.parse(readFileSync(join(repo, "spec/agent-editable/report.schema.json"), "utf8"));
  const validate = new Ajv2020({ allErrors: true, strict: false }).compile<any>(schema);
  assert.ok(validate(report), JSON.stringify(validate.errors));
  const json = JSON.parse(JSON.stringify(report));
  const jsonFinding = json.findings.find((f) => f.id === id);
  assert.deepEqual([jsonFinding.file, jsonFinding.line], ["moved.md", 5]);

  // The SARIF log points at the file and the line.
  const sarif = toSarif(report, { source: dir, build: null }, { cwd: dir });
  const result = sarif.runs[0].results.find((r) => r.ruleId === id);
  assert.ok(result, "the SARIF log has a result for the check");
  assert.equal(result.level, "warning");
  assert.deepEqual(result.locations[0].physicalLocation, { artifactLocation: { uri: "moved.md" }, region: { startLine: 5 } });
});
