import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  FIRST_RESULT_BUDGET_MS,
  formatNumber,
  formatReport,
  INDEX_BUDGET_BYTES,
  indexSize,
  MIN_PAGES,
  pageCount,
  verdict,
  type Measurement,
} from "./run.ts";

/** A temporary folder, removed when the test ends. */
function folder(t: { after: (fn: () => void) => void }): string {
  const dir = mkdtempSync(join(tmpdir(), "search-scale-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Writes one file, creating its folders. */
function write(dir: string, path: string, contents: string | Buffer): void {
  const file = join(dir, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, contents);
}

/** A measurement that passes, with any field overridden for the case under test. */
function measurement(overrides: Partial<Measurement> = {}): Measurement {
  return {
    pages: 600,
    indexBytes: 500_000,
    indexFiles: 400,
    ms: 50,
    samples: [40, 50, 60],
    results: 552,
    url: "/rules/cache-001/",
    title: "Rule cache-001",
    pageLoadIndexRequests: 0,
    queryIndexRequests: 7,
    ...overrides,
  };
}

test("numbers read at a glance, whatever the machine's locale", () => {
  assert.equal(formatNumber(0), "0");
  assert.equal(formatNumber(999), "999");
  assert.equal(formatNumber(1_000), "1,000");
  assert.equal(formatNumber(884_691), "884,691");
  assert.equal(formatNumber(1_000_000), "1,000,000");
});

test("the index is every file Pagefind wrote, however deep, and nothing else", (t) => {
  const dir = folder(t);
  write(dir, "pagefind/pagefind.js", "12345");
  write(dir, "pagefind/index/en_1.pf_index", "123");
  write(dir, "pagefind/fragment/en_2.pf_fragment", "1234567");
  write(dir, "pagefind/nested/deeper/filter/en_3.pf_filter", "123456789");
  write(dir, "index.html", "not part of the index");

  assert.deepEqual(indexSize(join(dir, "pagefind")), { bytes: 24, files: 4 });
});

test("a build with no index is zero bytes rather than an error", (t) => {
  const dir = folder(t);
  assert.deepEqual(indexSize(join(dir, "pagefind")), { bytes: 0, files: 0 });
});

test("the page count is every HTML page in the build, however deep", (t) => {
  const dir = folder(t);
  write(dir, "index.html", "");
  write(dir, "rules/index.html", "");
  write(dir, "rules/cache-001/index.html", "");
  write(dir, "dashboard/dashboard.js", "");

  assert.equal(pageCount(dir), 3);
  assert.equal(pageCount(join(dir, "missing")), 0);
});

test("a measurement inside both budgets passes", () => {
  assert.deepEqual(verdict(measurement()), { ok: true, problems: [] });
});

test("the index budget is exclusive: 999,999 bytes pass and 1,000,000 fails", () => {
  assert.deepEqual(verdict(measurement({ indexBytes: INDEX_BUDGET_BYTES - 1 })), { ok: true, problems: [] });
  assert.deepEqual(verdict(measurement({ indexBytes: INDEX_BUDGET_BYTES })), {
    ok: false,
    problems: [`the index is ${formatNumber(INDEX_BUDGET_BYTES)} bytes, over the ${formatNumber(INDEX_BUDGET_BYTES)} byte budget`],
  });
});

test("the time budget is exclusive: 299 ms passes and 300 ms fails", () => {
  assert.deepEqual(verdict(measurement({ ms: FIRST_RESULT_BUDGET_MS - 1 })), { ok: true, problems: [] });
  assert.deepEqual(verdict(measurement({ ms: FIRST_RESULT_BUDGET_MS })), {
    ok: false,
    problems: [`the first result took ${FIRST_RESULT_BUDGET_MS} ms, over the ${FIRST_RESULT_BUDGET_MS} ms budget`],
  });
});

test("a fixture below the scale the gate measures fails", () => {
  assert.deepEqual(verdict(measurement({ pages: MIN_PAGES - 1 })), {
    ok: false,
    problems: [`the build has ${MIN_PAGES - 1} pages; the gate measures at least ${MIN_PAGES}`],
  });
});

test("a build that wrote no index fails", () => {
  assert.deepEqual(verdict(measurement({ indexBytes: 0, indexFiles: 0 })), {
    ok: false,
    problems: ["the build wrote no search index under pagefind/"],
  });
});

test("an index fetched before search opens fails", () => {
  assert.deepEqual(verdict(measurement({ pageLoadIndexRequests: 2 })), {
    ok: false,
    problems: ["the page load fetched 2 file(s) from pagefind/; the index must load only when search opens"],
  });
});

test("a query that finds nothing fails, and so does one that fetched no index", () => {
  assert.deepEqual(verdict(measurement({ results: 0, url: "", title: "" })), {
    ok: false,
    problems: ['the query "rule" returned no results'],
  });
  assert.deepEqual(verdict(measurement({ queryIndexRequests: 0 })), {
    ok: false,
    problems: ["the first query fetched nothing from pagefind/"],
  });
});

test("every problem is named, in report order", () => {
  const decision = verdict(measurement({ pages: 1, indexBytes: 2_000_000, pageLoadIndexRequests: 1, results: 0, ms: 900 }));
  assert.deepEqual(decision.problems, [
    `the build has 1 pages; the gate measures at least ${MIN_PAGES}`,
    `the index is 2,000,000 bytes, over the ${formatNumber(INDEX_BUDGET_BYTES)} byte budget`,
    "the page load fetched 1 file(s) from pagefind/; the index must load only when search opens",
    'the query "rule" returned no results',
    `the first result took 900 ms, over the ${FIRST_RESULT_BUDGET_MS} ms budget`,
  ]);
});

test("the report prints both budgets, the hit, and the verdict", () => {
  const passing = measurement();
  const ok = formatReport(passing, verdict(passing));
  assert.equal(ok[0], "search-scale: docs-site: 600 pages");
  assert.equal(ok[1], "  index         500,000 bytes in 400 files (budget 1,000,000)");
  assert.equal(ok[2], "  first result  50 ms, median of 3 (40 ms, 50 ms, 60 ms); budget 300 ms");
  assert.equal(ok[3], "    /rules/cache-001/ — Rule cache-001, 552 results");
  assert.equal(ok[4], "  index load    0 files before search, 7 on the first query");
  assert.equal(ok.at(-1), "search-scale: OK");

  const failing = measurement({ ms: 900, results: 0 });
  const lines = formatReport(failing, verdict(failing));
  assert.ok(lines.includes(`  the first result took 900 ms, over the ${FIRST_RESULT_BUDGET_MS} ms budget`));
  assert.ok(lines.includes('  the query "rule" returned no results'));
  assert.equal(lines.at(-1), "search-scale: FAIL");
});
