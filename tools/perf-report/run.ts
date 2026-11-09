// Generates site/performance.md from the budgets and deterministic measurements of the gates (#1260).
//
//   node tools/perf-report/run.ts           fail when the page is stale (the check `npm run check` runs)
//   node tools/perf-report/run.ts --write   rewrite the page
//
// The JavaScript and CSS numbers come from the same fixture builds and pure measurement functions the gates use, so
// they are deterministic for a checkout. The Lighthouse scores and the cold-build time depend on the runner and the
// network simulation, so the page names their budgets and links the gates instead of freezing a local number.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { builtSite, FIXTURES, type FixtureName } from "../fixture-build/build.ts";
import { budget as measureJavaScript, budgetBytes as jsBudgetBytes } from "../js-budget-engine/run.ts";
import { budget as measureCss, budgetBytes as cssBudgetBytes } from "../css-budget-engine/run.ts";
import { BUDGET_MS, FIXTURE as buildTimeFixture } from "../build-time/run.ts";
import { CATEGORIES, FIXTURE as lighthouseFixture, PAGES, THRESHOLD } from "../lighthouse/run.ts";

/** The repository root: this file sits three levels below it. */
export const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

/** The page this tool generates. */
export const reportPath = join(root, "site/performance.md");

/** The page's date, fixed so a regeneration on another day does not make the page stale. */
export const reportDate = "2026-11-09";

/** Where the gates live, for the links the page publishes. */
const repository = "https://github.com/arminazimi/slipway/blob/main";

/** One fixture's JavaScript measurement. */
export interface JavaScriptFixture {
  /** The fixture folder under `fixtures/`. */
  readonly name: FixtureName;
  /** The number of HTML pages the gate measured. */
  readonly pages: number;
  /** The build-relative path of the page with the most scripts. */
  readonly largestPage: string;
  /** The compressed bytes that page loads. */
  readonly largestBytes: number;
}

/** The JavaScript gate's budget and what it measured on each fixture. */
export interface JavaScriptMeasurement {
  /** The per-page ceiling, in Brotli-compressed bytes. */
  readonly budgetBytes: number;
  /** Every fixture, in the gate's order. */
  readonly fixtures: readonly JavaScriptFixture[];
}

/** One fixture's CSS measurement. */
export interface CssFixtureMeasurement {
  /** The fixture folder under `fixtures/`. */
  readonly name: FixtureName;
  /** The number of stylesheets the build wrote. */
  readonly files: number;
  /** The Brotli-compressed bytes of every stylesheet together. */
  readonly bytes: number;
}

/** The CSS gate's budget and what it measured on each fixture. */
export interface CssMeasurement {
  /** The whole-site ceiling, in Brotli-compressed bytes. */
  readonly budgetBytes: number;
  /** Every fixture, in the gate's order. */
  readonly fixtures: readonly CssFixtureMeasurement[];
}

/** The build-time gate's budget and the fixture it times. */
export interface BuildTimeMeasurement {
  /** The cold-build ceiling, in milliseconds. */
  readonly budgetMs: number;
  /** The fixture the gate times. */
  readonly fixture: string;
  /** The pages that fixture has, so the budget names its size. */
  readonly pages: number;
}

/** The Lighthouse gate's budget and the pages it audits. */
export interface LighthouseMeasurement {
  /** The lowest score a category may get, as a percentage. */
  readonly threshold: number;
  /** The fixture the gate audits. */
  readonly fixture: string;
  /** The category ids the gate scores. */
  readonly categories: readonly string[];
  /** The build-relative URLs the gate audits. */
  readonly pages: readonly string[];
}

/** Everything the page states, kept separate from how it is measured so {@link renderReport} stays pure. */
export interface ReportInput {
  readonly javascript: JavaScriptMeasurement;
  readonly css: CssMeasurement;
  readonly buildTime: BuildTimeMeasurement;
  readonly lighthouse: LighthouseMeasurement;
}

/** Options for {@link main}; the tests point the generator at a temp folder and a fixed measurement. */
export interface MainOptions {
  /** The page to check or write. Default: {@link reportPath}. */
  readonly reportPath?: string;
  /** The measurement to render. Default: {@link measureGates}. */
  readonly measure?: () => Promise<ReportInput>;
}

/** A whole number with thousands separators, written the same way whatever the machine's locale. */
function group(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Bytes as KiB and bytes, such as `30 KiB (30,720 bytes)`. */
function sizeLabel(bytes: number): string {
  const kib = bytes / 1024;
  const amount = Number.isInteger(kib) ? String(kib) : kib.toFixed(1);
  return `${amount} KiB (${group(bytes)} bytes)`;
}

/** Milliseconds as seconds and milliseconds when it is whole seconds, such as `10 s (10,000 ms)`. */
function durationLabel(ms: number): string {
  const seconds = ms / 1000;
  return Number.isInteger(seconds) ? `${seconds} s (${group(ms)} ms)` : `${group(ms)} ms`;
}

/** The names the page shows for the Lighthouse category ids. An unknown id is spelled out. */
const categoryLabels: Readonly<Record<string, string>> = {
  performance: "performance",
  accessibility: "accessibility",
  "best-practices": "best practices",
  seo: "SEO",
};

/** One category id as a phrase. */
function categoryLabel(id: string): string {
  return categoryLabels[id] ?? id.replaceAll("-", " ");
}

/** English list: `a`, `a and b`, `a, b, and c`. */
function list(values: readonly string[]): string {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0]!;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

/** A table cell: pipes cannot break the row. */
function cell(text: string): string {
  return text.replaceAll("|", "\\|").replaceAll("\n", " ");
}

/** A value written as code inside a table cell. */
function code(text: string): string {
  return `\`${cell(text)}\``;
}

/**
 * Renders the page from a measurement. Pure: the same input always gives the same bytes, so the stale check can
 * compare it with the committed file without reading a clock or the machine.
 */
export function renderReport(input: ReportInput): string {
  const javascript = input.javascript;
  const css = input.css;
  const buildTime = input.buildTime;
  const lighthouse = input.lighthouse;

  const javascriptRows = javascript.fixtures
    .map(
      (fixture) =>
        `| ${code(fixture.name)} | ${group(fixture.pages)} | ${code(fixture.largestPage)} | ${group(fixture.largestBytes)} |`,
    )
    .join("\n");
  const cssRows = css.fixtures
    .map((fixture) => `| ${code(fixture.name)} | ${group(fixture.files)} | ${group(fixture.bytes)} |`)
    .join("\n");

  return `---
title: Performance
description: The performance budgets Slipway ships under, and the numbers its gates measure.
layout: doc
permalink: /performance/
date: ${reportDate}
author: Slipway
---
<!-- Generated from the gates by tools/perf-report/run.ts. Do not edit below this line. -->

Slipway's speed is enforced, not claimed. Four gates in \`npm run check\` build the fixture sites and fail a pull request that misses a budget. This page reads the same constants and measurement functions, so the figures cannot drift from what CI runs.

## JavaScript

**Budget: ${sizeLabel(javascript.budgetBytes)} of Brotli-compressed JavaScript per page.** The gate counts each page's external and inline scripts and the static modules they import, each compressed once at Brotli's maximum quality.

| Fixture | Pages | Largest page | Compressed bytes |
| --- | --- | --- | --- |
${javascriptRows}

[The JavaScript gate](${repository}/tools/js-budget-engine/run.ts) fails a page over the budget.

## CSS

**Budget: ${sizeLabel(css.budgetBytes)} of Brotli-compressed CSS for the whole site.** Every stylesheet a build writes counts, whether a page links it yet or not.

| Fixture | Stylesheets | Compressed bytes |
| --- | --- | --- |
${cssRows}

[The CSS gate](${repository}/tools/css-budget-engine/run.ts) fails a build over the budget.

## Lighthouse

**Budget: ${lighthouse.threshold} or higher in each of ${lighthouse.categories.length} categories** — ${list(lighthouse.categories.map(categoryLabel))} — on mobile settings, for ${lighthouse.pages.length} pages that stand in for the fixture's page shapes: ${list(lighthouse.pages.map(code))}. Scores depend on the runner and the network simulation, so [the Lighthouse gate](${repository}/tools/lighthouse/run.ts) measures them on every CI run; this page links the gate instead of freezing a machine-specific score.

## Build time

**Budget: ${durationLabel(buildTime.budgetMs)} for one cold build of the ${group(buildTime.pages)}-page ${code(buildTime.fixture)} fixture.** A cold build discards the cache, so it measures what a contributor waits for rather than a warm reuse. Build time depends on the runner, so [the build-time gate](${repository}/tools/build-time/run.ts) measures it on CI; this page links the gate instead of freezing a machine-specific time.

## How the page stays honest

${code("site/performance.md")} is generated by ${code("tools/perf-report/run.ts")}. ${code("npm run check")} reruns the generator and fails when the page and the gates disagree; ${code("node tools/perf-report/run.ts --write")} updates it. The JavaScript and CSS figures are deterministic for a checkout because they are read from fixture builds of the same source, with Brotli at its maximum quality. The Lighthouse scores and the cold-build time are measured on the CI runner and linked above instead of being copied here.
`;
}

/**
 * Measures the fixtures through the gates' own functions. The JavaScript and CSS figures are deterministic; the
 * Lighthouse and build-time budgets are constants, because their measurements depend on the runner.
 */
export async function measureGates(): Promise<ReportInput> {
  const builds = new Map<FixtureName, string>();
  for (const name of FIXTURES) builds.set(name, await builtSite(name));

  const javascript: JavaScriptFixture[] = [];
  const css: CssFixtureMeasurement[] = [];
  for (const name of FIXTURES) {
    const dir = builds.get(name)!;

    const js = measureJavaScript(dir);
    if (js.problems.length > 0) {
      throw new Error(`perf-report: the JavaScript gate could not measure ${name}:\n${js.problems.join("\n")}`);
    }
    if (js.pages.length === 0) throw new Error(`perf-report: the JavaScript gate found no pages in ${name}.`);
    const largest = js.pages.reduce((winner, page) => (page.bytes > winner.bytes ? page : winner));
    javascript.push({
      name,
      pages: js.pages.length,
      largestPage: largest.page,
      largestBytes: largest.bytes,
    });

    const sheets = measureCss(dir);
    if (sheets.problems.length > 0) {
      throw new Error(`perf-report: the CSS gate could not measure ${name}:\n${sheets.problems.join("\n")}`);
    }
    css.push({ name, files: sheets.files.length, bytes: sheets.bytes });
  }

  const timed = javascript.find((fixture) => fixture.name === buildTimeFixture);
  if (timed === undefined) {
    throw new Error(`perf-report: the build-time gate measures ${buildTimeFixture}, which is not a measured fixture.`);
  }

  return {
    javascript: { budgetBytes: jsBudgetBytes, fixtures: javascript },
    css: { budgetBytes: cssBudgetBytes, fixtures: css },
    buildTime: { budgetMs: BUDGET_MS, fixture: buildTimeFixture, pages: timed.pages },
    lighthouse: {
      threshold: THRESHOLD,
      fixture: lighthouseFixture,
      categories: CATEGORIES,
      pages: PAGES.map((page) => page.url),
    },
  };
}

/** Checks the committed page, or with `--write` regenerates it; returns the process exit code. */
export async function main(args: readonly string[] = process.argv.slice(2), options: MainOptions = {}): Promise<number> {
  const target = options.reportPath ?? reportPath;
  const measure = options.measure ?? measureGates;
  const expected = renderReport(await measure());

  if (args.includes("--write")) {
    writeFileSync(target, expected);
    console.log(`wrote ${relative(root, target)}`);
    return 0;
  }

  let actual: string | null = null;
  try {
    actual = readFileSync(target, "utf8");
  } catch {
    // A missing page is stale too.
  }
  if (actual !== expected) {
    console.error(`${relative(root, target)} is stale; run node tools/perf-report/run.ts --write`);
    return 1;
  }
  console.log(`OK perf-report: ${relative(root, target)} matches the gates`);
  return 0;
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
