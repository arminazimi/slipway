import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { id, run } from "../src/checks/sourcemap-fresh.mjs";
import { doctor, loadTests } from "../src/doctor.mjs";
import { toSarif } from "../src/report.mjs";
import { Site } from "../src/site.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);

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
  const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
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
