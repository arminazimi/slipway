// Runs the agent-editable spec's tests (spec/tests.json) on a source folder and, optionally, its built output,
// and reports the highest conformance level reached. Generator modules (checks/) add their own checks when they
// apply; those are warnings and never change the level.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checks } from "./checks.mjs";
import { detect } from "./detect.mjs";
import { locate } from "./report.mjs";
import * as jekyll from "./checks/jekyll.mjs";
import { Site } from "./site.mjs";

/** Generator modules: `{ applies(site), checks }`. Each check returns `{ status, findings }`. */
export const generators = { jekyll };

export const levels = ["L0", "L1", "L2", "L3"];

/** The packaged copy of spec/agent-editable/tests.json. */
export function loadTests(path = fileURLToPath(new URL("../spec/tests.json", import.meta.url))) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** The highest level whose MUST tests, with those of every level below, all passed or were not run. */
export function levelReached(results) {
  let reached = null;
  for (const level of levels) {
    const upTo = levels.slice(0, levels.indexOf(level) + 1);
    const failed = results.some((r) => r.keyword === "MUST" && upTo.includes(r.level) && r.status === "fail");
    if (failed) break;
    reached = level;
  }
  return reached;
}

/**
 * Checks a site. `source` is the source folder, `build` the built output folder (optional).
 * Returns the report in spec/agent-editable/report.schema.json: `{ spec, version, generator, level,
 * notRun, tests, findings }`. Each finding has the test `id`, `severity` (`error` for a MUST,
 * `warning` for a SHOULD), the file relative to the source or output folder (`in`), and the line
 * and key when known. A finding on a built page names its source file through the source map.
 * `generator` is the detected site generator, or `"unknown"`. Generator checks follow the spec tests with
 * `level: null`, `keyword: null`, and the generator as `scope`; their findings are warnings with a `fix`.
 * `deprecations` replaces the packaged list of deprecated names (for tests).
 */
export async function doctor(source, { build = null, network = false, tests = loadTests(), deprecations } = {}) {
  if (!existsSync(source)) throw new Error(`${source}: no such folder`);
  if (build && !existsSync(build)) throw new Error(`${build}: no such folder`);
  const site = new Site(source, { build, network });
  const results = [];
  for (const test of tests.tests) {
    const result = { id: test.id, level: test.level, keyword: test.keyword, scope: test.scope, description: test.description, status: "pass", findings: [] };
    if (test.how === "review") {
      result.status = "not-run";
      result.reason = "decided by a person: " + test.check;
    } else if (!checks[test.id]) {
      result.status = "not-run";
      result.reason = "this version of slipway doctor has no check for it";
    } else {
      Object.assign(result, await checks[test.id](site, test));
    }
    if (result.status === "fail" && !result.findings.length) result.findings.push({ message: test.description });
    results.push(result);
  }
  for (const [name, generator] of Object.entries(generators)) {
    if (!generator.applies(site)) continue;
    for (const [id, check] of Object.entries(generator.checks)) {
      results.push({ id, level: null, keyword: null, scope: name, ...(await check(site, { deprecations })) });
    }
  }
  for (const result of results) result.findings = result.findings.map((finding) => locate(site, finding));
  const findings = results.flatMap((result) =>
    result.status === "fail"
      ? result.findings.map((finding) => ({ id: result.id, severity: result.keyword === "MUST" ? "error" : "warning", ...finding }))
      : [],
  );
  return {
    spec: "agent-editable",
    version: tests.version,
    generator: detect(site.source).generator,
    level: levelReached(results),
    notRun: results.filter((r) => r.status === "not-run").map((r) => r.id),
    tests: results,
    findings,
  };
}
