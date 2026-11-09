import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { main, measureGates, renderReport, reportPath, type ReportInput } from "./run.ts";

/** The fixture builds are shared and cached, so every test in this file measures them once. */
let measured: Promise<ReportInput> | undefined;
function measurement(): Promise<ReportInput> {
  return (measured ??= measureGates());
}

/** A temporary page path, removed when the test ends. */
function tempPage(t: { after: (fn: () => void) => void }): string {
  const dir = mkdtempSync(join(tmpdir(), "perf-report-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return join(dir, "performance.md");
}

/** Runs a test with the generator's console output silenced. */
async function quiet<T>(fn: () => Promise<T>): Promise<T> {
  const [log, error] = [console.log, console.error];
  console.log = console.error = () => {};
  try {
    return await fn();
  } finally {
    console.log = log;
    console.error = error;
  }
}

test("the committed page matches the gates", async () => {
  const expected = renderReport(await measurement());
  assert.equal(readFileSync(reportPath, "utf8"), expected, "run node tools/perf-report/run.ts --write");
});

test("a changed budget or measurement makes the page stale", async () => {
  const input = await measurement();
  const committed = readFileSync(reportPath, "utf8");

  const jsBudget = {
    ...input,
    javascript: { ...input.javascript, budgetBytes: input.javascript.budgetBytes + 1 },
  };
  assert.notEqual(renderReport(jsBudget), committed, "a changed JavaScript budget changes the page");

  const cssBytes = {
    ...input,
    css: {
      ...input.css,
      fixtures: input.css.fixtures.map((fixture, index) => (index === 0 ? { ...fixture, bytes: fixture.bytes + 1 } : fixture)),
    },
  };
  assert.notEqual(renderReport(cssBytes), committed, "a changed CSS measurement changes the page");

  const buildTime = {
    ...input,
    buildTime: { ...input.buildTime, budgetMs: input.buildTime.budgetMs + 1 },
  };
  assert.notEqual(renderReport(buildTime), committed, "a changed build-time budget changes the page");

  const lighthouse = {
    ...input,
    lighthouse: { ...input.lighthouse, threshold: input.lighthouse.threshold - 1 },
  };
  assert.notEqual(renderReport(lighthouse), committed, "a changed Lighthouse threshold changes the page");
});

test("--write writes the page in a temp folder, and check mode accepts it afterwards", async (t) => {
  const target = tempPage(t);
  writeFileSync(target, "stale\n");

  assert.equal(await quiet(() => main([], { reportPath: target })), 1, "a stale page fails the check");
  assert.equal(await quiet(() => main(["--write"], { reportPath: target })), 0, "--write regenerates the page");
  assert.equal(readFileSync(target, "utf8"), renderReport(await measurement()));
  assert.equal(await quiet(() => main([], { reportPath: target })), 0, "the generated page passes the check");
});

test("the page uses the engine front matter and links every gate", async () => {
  const page = readFileSync(reportPath, "utf8");
  assert.match(page, /^---\ntitle: Performance\ndescription: .+\nlayout: doc\npermalink: \/performance\/\ndate: \d{4}-\d{2}-\d{2}\nauthor: Slipway\n---\n/);
  for (const gate of ["js-budget-engine", "css-budget-engine", "lighthouse", "build-time"]) {
    assert.ok(page.includes(`/tools/${gate}/run.ts`), `the page links the ${gate} gate`);
  }
});
