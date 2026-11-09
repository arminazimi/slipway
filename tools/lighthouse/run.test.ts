import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { builtSite } from "../fixture-build/build.ts";
import {
  audit,
  CATEGORIES,
  fileOf,
  FIXTURE,
  lighthouseRunner,
  linesFor,
  PAGES,
  report,
  type AuditResult,
  type Category,
  type CategoryResult,
  type PageResult,
  type PageTarget,
} from "./run.ts";

/** A temporary folder; every test that writes files uses one. */
function folder(t: { after: (fn: () => void) => void }): string {
  const dir = mkdtempSync(join(tmpdir(), "lighthouse-gate-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** A category with one failing audit, so a failure has something to name. */
function category(id: Category, score: number | null, audits: readonly AuditResult[] = []): CategoryResult {
  return { id, title: id, score, audits };
}

/** A page whose categories all score the same, unless the caller overrides one. */
function page(target: PageTarget, scores: Partial<Record<Category, number | null>>): PageResult {
  return {
    target,
    categories: CATEGORIES.map((id) => category(id, scores[id] === undefined ? 1 : scores[id])),
  };
}

/** Runs a test with console output silenced, so a gate that reports a failure stays quiet in the test log. */
async function quiet<T>(fn: () => Promise<T> | T): Promise<{ result: T; output: string }> {
  const lines: string[] = [];
  const [log, error] = [console.log, console.error];
  console.log = console.error = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  try {
    return { result: await fn(), output: lines.join("\n") };
  } finally {
    console.log = log;
    console.error = error;
  }
}

test("audits every page once and passes at exactly the budget", async () => {
  const seen: string[] = [];
  const runner = async (target: PageTarget): Promise<PageResult> => {
    seen.push(target.url);
    return page(target, { performance: 0.95, accessibility: 0.95, "best-practices": 0.95, seo: 0.95 });
  };

  const result = await audit(PAGES, runner);

  assert.deepEqual(seen, PAGES.map((target) => target.url));
  assert.equal(result.pages.length, PAGES.length);
  assert.equal(result.failures.length, 0);
  assert.equal(result.errors.length, 0);
  assert.deepEqual(
    result.pages[0]!.categories.map((found) => found.id),
    [...CATEGORIES],
  );

  const { result: passed, output } = await quiet(() => report(result));
  assert.equal(passed, true);
  assert.match(output, /OK: lighthouse \(4 pages × 4 categories, minimum 95\)/);
});

test("fails a category below the budget and prints its failing audits", async () => {
  const target: PageTarget = { url: "/install/", name: "guide" };
  const metaDescription: AuditResult = { id: "meta-description", title: "Document has a meta description", score: 0 };
  const runner = async (): Promise<PageResult> => ({
    target,
    categories: CATEGORIES.map((id) =>
      id === "seo" ? category("seo", 0.91, [metaDescription]) : category(id, 1),
    ),
  });

  const result = await audit([target], runner);

  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0]!.category.id, "seo");
  assert.match(linesFor(result.failures[0]!)[0]!, /FAIL \/install\/ \(guide\): seo 91 \(minimum 95\)/);
  assert.match(linesFor(result.failures[0]!)[1]!, /meta-description \(0\): Document has a meta description/);

  const { result: passed, output } = await quiet(() => report(result));
  assert.equal(passed, false);
  assert.match(output, /meta-description/);
});

test("a page whose audit did not finish fails the gate", async () => {
  const target: PageTarget = { url: "/dashboard/", name: "app page" };
  const result = await audit([target], async () => ({ target, categories: [], error: "CHROME_INTERSTITIAL_ERROR" }));

  assert.equal(result.failures.length, 0);
  assert.equal(result.errors.length, 1);
  const { result: passed, output } = await quiet(() => report(result));
  assert.equal(passed, false);
  assert.match(output, /FAIL \/dashboard\/ \(app page\): CHROME_INTERSTITIAL_ERROR/);
});

test("a category Lighthouse did not score is a failure, not a pass", async () => {
  const target: PageTarget = { url: "/security/", name: "guide" };
  const result = await audit([target], async () => page(target, { accessibility: null }));
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0]!.category.id, "accessibility");
  assert.match(linesFor(result.failures[0]!)[0]!, /accessibility not scored/);
});

test("every page the gate audits exists in the fixture build", async () => {
  const build = await builtSite(FIXTURE);
  assert.equal(PAGES.length, 4);
  assert.equal(new Set(PAGES.map((target) => target.url)).size, PAGES.length);
  for (const target of PAGES) assert.ok(existsSync(fileOf(build, target.url)), `fixture build has ${target.url} (${target.name})`);
});

test("the gate passes fixtures/docs-site and fails a deliberately broken copy", async (t) => {
  const build = await builtSite(FIXTURE);
  const real = await lighthouseRunner(build);
  if ("skip" in real) {
    t.skip(real.skip);
    return;
  }

  try {
    const clean = await audit(PAGES, real.run);
    assert.deepEqual(
      clean.failures.flatMap((failure) => linesFor(failure)),
      [],
      "the docs fixture scores at least 95 in every category",
    );
  } finally {
    await real.close();
  }

  // A copy with the install page's meta description removed is the "deliberately broken fixture" the issue asks
  // for: its SEO score drops below the budget, so the same gate fails it.
  const copy = join(folder(t), "site");
  cpSync(build, copy, { recursive: true });
  const file = fileOf(copy, "/install/");
  const html = readFileSync(file, "utf8");
  const marker = /<meta name="description"[^>]*\/?>/;
  assert.match(html, marker, "the install page has a meta description");
  writeFileSync(file, html.replace(marker, ""));

  const broken = await lighthouseRunner(copy);
  assert.ok(!("skip" in broken), "the same browser audits the broken copy");
  try {
    const result = await audit([{ url: "/install/", name: "guide" }], broken.run);
    assert.ok(result.failures.length > 0, "the gate fails the broken copy");
    assert.ok(
      result.failures.some((failure) => failure.category.id === "seo"),
      `expected seo to fail, got ${result.failures.map((failure) => failure.category.id).join(", ")}`,
    );
  } finally {
    await broken.close();
  }
});
