import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { doctor, loadTests } from "../src/doctor.mjs";
import { toSarif } from "../src/report.mjs";
import { id, run } from "../src/checks/agents-commands.mjs";
import { Site } from "../src/site.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);

test("agents-commands fires on the broken fixture", async () => {
  const site = new Site(fixture("agents-commands"));
  const { status, findings } = await run(site);

  assert.equal(status, "fail");
  assert.deepEqual(
    findings.map(({ line, message }) => ({ line, message })),
    [
      { line: 20, message: "`npm run deploy` is not a script in `package.json`" },
      { line: 21, message: "`_data/navigation.yml` does not exist in the site" },
    ],
  );
  assert.ok(findings.every((finding) => finding.in === "source" && finding.file === "AGENTS.md"));
  assert.ok(findings.every((finding) => finding.fix));
});

test("agents-commands is silent on every example", async () => {
  for (const name of readdirSync(join(repo, "examples"))) {
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
    tests: [...tests.tests, { id, level: null, keyword: null, scope: "doctor", how: "automated", description: "Every command in AGENTS.md works in the site." }],
  };
}

test("the JSON and the SARIF output carry the file and the line", async () => {
  const dir = fixture("agents-commands");
  const report = await doctor(dir, { tests: testsWith() });
  const plain = await doctor(dir);

  // The check is a warning: it never changes the level the site reaches.
  assert.equal(report.level, plain.level);

  const finding = report.findings.find((f) => f.id === id);
  assert.ok(finding, "the report has a finding for the check");
  assert.equal(finding.severity, "warning");
  assert.deepEqual([finding.in, finding.file, finding.line], ["source", "AGENTS.md", 20]);

  // The JSON report is the report schema's shape.
  const schema = JSON.parse(readFileSync(join(repo, "spec/agent-editable/report.schema.json"), "utf8"));
  const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
  assert.ok(validate(report), JSON.stringify(validate.errors));
  const json = JSON.parse(JSON.stringify(report));
  const jsonFinding = json.findings.find((f) => f.id === id);
  assert.deepEqual([jsonFinding.file, jsonFinding.line], ["AGENTS.md", 20]);

  // The SARIF log points at the file and the line.
  const sarif = toSarif(report, { source: dir, build: null }, { cwd: dir });
  const result = sarif.runs[0].results.find((r) => r.ruleId === id);
  assert.ok(result, "the SARIF log has a result for the check");
  assert.equal(result.level, "warning");
  assert.deepEqual(result.locations[0].physicalLocation, { artifactLocation: { uri: "AGENTS.md" }, region: { startLine: 20 } });
});
