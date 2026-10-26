import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { doctor } from "../src/doctor.mjs";
import { toAnnotations } from "../src/github.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);
const action = join(repo, "action/doctor");

test("one annotation per finding, with the file and line relative to the repository root", async () => {
  const folders = { source: fixture("invalid-front-matter"), build: join(fixture("invalid-front-matter"), "build") };
  const report = await doctor(folders.source, { build: folders.build });
  const lines = toAnnotations(report, folders, { cwd: repo });
  assert.equal(lines.length, report.findings.length);
  assert.ok(lines.length > 0);
  for (const line of lines) assert.match(line, /^::(error|warning) (file=[^,]+,(line=\d+,(col=\d+,)?)?)?title=[^:]+::\S/);
  assert.ok(
    lines.includes("::error file=packages/doctor/test/fixtures/invalid-front-matter/pages/index.md,line=3,title=ae.schemas.valid::colour: is not a known key (allowed: title, layout)"),
    lines.join("\n"),
  );
});

test("a finding with no file has no location, and workflow command characters are escaped", () => {
  const report = {
    findings: [
      { id: "ae.sourcemap.present", severity: "error", message: "needs the output folder" },
      { id: "x.y", severity: "warning", message: "50%\nnext", in: "source", file: "a,b:c.md", line: 4, column: 2, fix: "rename it" },
    ],
  };
  assert.deepEqual(toAnnotations(report, { source: repo, build: null }, { cwd: repo }), [
    "::error title=ae.sourcemap.present::needs the output folder",
    "::warning file=a%2Cb%3Ac.md,line=4,col=2,title=x.y::50%25%0Anext (fix: rename it)",
  ]);
});

function runAction(t, env) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-action-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const output = join(dir, "output");
  const result = spawnSync(process.execPath, [join(action, "run.mjs")], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, GITHUB_OUTPUT: output, ...env },
  });
  return { ...result, dir, outputs: existsSync(output) ? readFileSync(output, "utf8") : "" };
}

test("the action passes on a site that reaches the level and writes SARIF when asked", (t) => {
  const result = runAction(t, {
    SLIPWAY_PATH: fixture("conforming"),
    SLIPWAY_BUILD: join(fixture("conforming"), "build"),
    SLIPWAY_LEVEL: "L3",
    SLIPWAY_SARIF: "true",
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /level: L3/);
  assert.match(result.outputs, /^level=L3$/m);
  assert.match(result.outputs, /^sarif-file=slipway\.sarif$/m);
  assert.equal(JSON.parse(readFileSync(join(result.dir, "slipway.sarif"), "utf8")).version, "2.1.0");
});

test("the action fails below the level, and level none only reports", (t) => {
  const env = { SLIPWAY_PATH: fixture("invalid-front-matter"), SLIPWAY_BUILD: join(fixture("invalid-front-matter"), "build") };
  const below = runAction(t, { ...env, SLIPWAY_LEVEL: "L1" });
  assert.equal(below.status, 1);
  assert.match(below.stdout, /^::error file=.*pages\/index\.md,line=3,title=ae\.schemas\.valid::/m);
  assert.match(below.outputs, /^level=L0$/m);
  assert.equal(runAction(t, { ...env, SLIPWAY_LEVEL: "none" }).status, 0);
  assert.equal(runAction(t, { ...env, SLIPWAY_LEVEL: "L9" }).status, 2);
});

test("action.yml passes every input to the step", () => {
  const spec = parse(readFileSync(join(action, "action.yml"), "utf8"));
  assert.equal(spec.runs.using, "composite");
  const step = spec.runs.steps.find((s) => s.id === "doctor");
  for (const name of ["path", "build", "level", "format", "sarif", "sarif-file"]) {
    const variable = `SLIPWAY_${name.toUpperCase().replace("-", "_")}`;
    assert.equal(step.env[variable], `\${{ inputs.${name} }}`, name);
  }
  assert.equal(spec.inputs.level.default, "L1");
});
