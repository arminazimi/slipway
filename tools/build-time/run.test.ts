import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  BUDGET_MS,
  budgetFrom,
  formatReport,
  measure,
  onCI,
  root,
  verdict,
  type BuildTimeReport,
} from "./run.ts";

/** A temporary folder, removed when the test ends. */
function tempDir(t: { after: (fn: () => void) => void }, prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test("onCI is true on a CI runner and false on a workstation", () => {
  assert.equal(onCI({ CI: "true" }), true);
  assert.equal(onCI({ CI: "1" }), true);
  assert.equal(onCI({ CI: "false" }), false);
  assert.equal(onCI({}), false);
});

test("a clean build under budget passes", () => {
  assert.deepEqual(verdict({ errors: [], totalMs: BUDGET_MS - 1, budgetMs: BUDGET_MS, ci: true }), {
    ok: true,
    warn: false,
    problems: [],
  });
});

test("a budget miss fails on CI and only warns on a local run", () => {
  const miss = `the build took ${BUDGET_MS + 1} ms, over the ${BUDGET_MS} ms budget`;

  assert.deepEqual(verdict({ errors: [], totalMs: BUDGET_MS + 1, budgetMs: BUDGET_MS, ci: true }), {
    ok: false,
    warn: false,
    problems: [miss],
  });
  assert.deepEqual(verdict({ errors: [], totalMs: BUDGET_MS + 1, budgetMs: BUDGET_MS, ci: false }), {
    ok: true,
    warn: true,
    problems: [miss],
  });
});

test("a build error fails the gate everywhere, whatever the time", () => {
  assert.deepEqual(
    verdict({ errors: ["config.unknown-key: Unknown key `nope`."], totalMs: 1, budgetMs: BUDGET_MS, ci: false }),
    { ok: false, warn: false, problems: ["config.unknown-key: Unknown key `nope`."] },
  );
});

test("the report prints the total, every stage, and the verdict", () => {
  const report: BuildTimeReport = {
    fixture: "docs-site",
    pages: 594,
    totalMs: 1200,
    budgetMs: BUDGET_MS,
    stages: [
      { stage: "model", ms: 285 },
      { stage: "theme", ms: 2 },
      { stage: "render + write", ms: 913 },
    ],
    problems: [],
    ok: true,
    warn: false,
  };

  const lines = formatReport(report);
  assert.match(lines[0]!, /^build-time: docs-site: 594 pages in 1200 ms \(budget 10000 ms\)$/);
  assert.match(lines[1]!, /^\s+model\s+285 ms$/);
  assert.match(lines[2]!, /^\s+theme\s+2 ms$/);
  assert.match(lines[3]!, /^\s+render \+ write\s+913 ms$/);
  assert.equal(lines.at(-1), "build-time: OK");
});

test("a warning says why it did not fail", () => {
  const report: BuildTimeReport = {
    fixture: "docs-site",
    pages: 594,
    totalMs: BUDGET_MS + 1,
    budgetMs: BUDGET_MS,
    stages: [],
    problems: ["the build took 10001 ms, over the 10000 ms budget"],
    ok: true,
    warn: true,
  };

  const lines = formatReport(report);
  assert.ok(lines.some((line) => line.includes("fails on CI, not on a local run")));
  assert.equal(lines.at(-1), "build-time: WARN");
});

test("--budget reads a positive number and falls back to the default", () => {
  assert.equal(budgetFrom([]), BUDGET_MS);
  assert.equal(budgetFrom(["--budget", "2500"]), 2500);
  assert.equal(budgetFrom(["--budget", "nope"]), BUDGET_MS);
  assert.equal(budgetFrom(["--budget", "0"]), BUDGET_MS);
});

test("times a small site and names every stage", async (t) => {
  const site = tempDir(t, "build-time-site-");
  writeFileSync(join(site, "index.md"), "# Hello\n\nA small site.\n");
  const out = join(tempDir(t, "build-time-out-"), "out");

  const report = await measure({ siteRoot: site, out, budgetMs: 60_000 });

  assert.equal(report.ok, true, report.problems.join("\n"));
  assert.equal(report.pages, 2, "the site's page and the 404.html every site gets");
  assert.deepEqual(
    report.stages.map((stage) => stage.stage),
    ["model", "theme", "render + write"],
  );
  assert.ok(report.stages.every((stage) => stage.ms >= 0));
  assert.ok(report.totalMs > 0);
});

test("passes on fixtures/docs-site, the 600-page fixture", async (t) => {
  const out = join(tempDir(t, "build-time-docs-"), "out");

  const report = await measure({ out, budgetMs: 60_000 });

  assert.equal(report.ok, true, report.problems.join("\n"));
  assert.ok(report.pages >= 590, `expected about 600 pages, got ${report.pages}`);
});

test("fails on a deliberately broken copy of the fixture", async (t) => {
  const dir = tempDir(t, "build-time-broken-");
  const site = join(dir, "docs-site");
  cpSync(join(root, "fixtures", "docs-site"), site, { recursive: true });
  // The copy is a real fixture with one broken config key: the build must still fail the gate.
  writeFileSync(join(site, "mizzen.yml"), "unknownKey: true\n");

  const report = await measure({ siteRoot: site, out: join(dir, "out"), budgetMs: 60_000 });

  assert.equal(report.ok, false);
  assert.ok(
    report.problems.some((problem) => problem.startsWith("config.unknown-key:")),
    `expected a config error, got ${report.problems.join(" | ")}`,
  );
});
