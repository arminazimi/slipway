// Build-time gate: a cold build of the big docs fixture stays under 10 seconds.
//
//   node tools/build-time/run.ts              time the build (fails in CI, only warns locally)
//   node tools/build-time/run.ts --budget 5000
//
// `npm run check` runs this through tools/check.ts. The fixture is `fixtures/docs-site` (about 600 pages); the small
// `rtl-site` says nothing about scale. The gate builds a fresh output folder every time, because a cached build from
// tools/fixture-build measures nothing.
//
// The engine builds the model and loads the theme as separate steps, but `build()` does not time them. This gate times
// each step on its own so a regression points at a stage, and calls the rest of the cold build "render + write". The
// budget is enforced on the real, cold build: the number a visitor waits for.
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build, type BuildResult } from "../../packages/engine/src/pipeline/build.ts";
import { buildModel } from "../../packages/engine/src/model/build.ts";
import { loadRegistry } from "../../packages/engine/src/render/registry.ts";

/** The repository root: this file sits three levels below it. */
export const root = join(fileURLToPath(import.meta.url), "../../..");

/** The budget: a full build of the 600-page fixture, in milliseconds. */
export const BUDGET_MS = 10_000;

/** The fixture the gate times; it holds about 600 pages, like a large generated reference. */
export const FIXTURE = "docs-site";

/** The layout the engine CLI gives a page that names none (`mizzen build`). */
const DEFAULT_LAYOUT = "doc";

/** One timed part of the build. */
export interface StageTiming {
  /** What was timed: `model`, `theme`, or `render + write`. */
  readonly stage: string;
  /** The stage's time, in whole milliseconds. */
  readonly ms: number;
}

/** What a timing run found. */
export interface BuildTimeReport {
  /** The fixture's name, for the printed line. */
  readonly fixture: string;
  /** The HTML pages the build wrote. */
  readonly pages: number;
  /** The whole cold build, in whole milliseconds. */
  readonly totalMs: number;
  /** The budget the total was measured against, in milliseconds. */
  readonly budgetMs: number;
  /** The timed stages, in build order. */
  readonly stages: readonly StageTiming[];
  /** Everything that went wrong: build errors and, when the gate fails, a budget miss. */
  readonly problems: readonly string[];
  /** True when the build is clean and either inside the budget or only warning. */
  readonly ok: boolean;
  /** True when the build was over budget on a local run, where the gate only warns. */
  readonly warn: boolean;
}

/** How the gate decides, kept pure so its rules can be tested without a build. */
export interface VerdictOptions {
  /** Build errors, already formatted. */
  readonly errors: readonly string[];
  readonly totalMs: number;
  readonly budgetMs: number;
  /** True on CI, where a budget miss fails the gate. */
  readonly ci: boolean;
}

/** The gate's decision for one timing run. */
export interface Verdict {
  readonly ok: boolean;
  readonly warn: boolean;
  readonly problems: readonly string[];
}

/** Where and how {@link measure} builds. Every field has a default. */
export interface MeasureOptions {
  /** Site root to build. Default: `<repo>/fixtures/docs-site`. */
  readonly siteRoot?: string;
  /** The theme's root. Default: `<repo>/packages/theme`. */
  readonly themeRoot?: string;
  /** Output folder, replaced by the build. Default: a fresh folder under `.tmp/build-time/`. */
  readonly out?: string;
  /** The budget in milliseconds. Default: {@link BUDGET_MS}. */
  readonly budgetMs?: number;
  /** True on CI. Default: {@link onCI}. */
  readonly ci?: boolean;
}

/** True on a CI runner, where a budget miss fails the gate. GitHub Actions sets `CI=true`. */
export function onCI(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.CI === "true" || env.CI === "1";
}

/** Rounds to whole milliseconds, so the table reads as a table. */
function ms(value: number): number {
  return Math.round(value);
}

/** Times one async step and returns its duration in milliseconds. */
async function timed(step: () => Promise<unknown>): Promise<number> {
  const began = performance.now();
  await step();
  return ms(performance.now() - began);
}

/**
 * Decides whether a timing run passes. A build error always fails. A total over the budget fails on CI and only warns
 * on a local run: the budget protects the CI runner, which is slower and shared.
 */
export function verdict(options: VerdictOptions): Verdict {
  const { errors, totalMs, budgetMs, ci } = options;
  if (errors.length > 0) return { ok: false, warn: false, problems: [...errors] };

  if (totalMs > budgetMs) {
    const miss = `the build took ${totalMs} ms, over the ${budgetMs} ms budget`;
    return ci
      ? { ok: false, warn: false, problems: [miss] }
      : { ok: true, warn: true, problems: [miss] };
  }
  return { ok: true, warn: false, problems: [] };
}

/** True when the build wrote no error-level diagnostic. */
function buildErrors(result: BuildResult): string[] {
  return result.diagnostics
    .filter((diagnostic) => diagnostic.severity === "error")
    .map((diagnostic) => `${diagnostic.id}: ${diagnostic.message}`);
}

/**
 * Runs one cold build of `options.siteRoot` and times it, then times the engine's model and theme stages on their own
 * so the report can split the total into parts. The third stage is the remainder: render, assets, and writing.
 */
export async function measure(options: MeasureOptions = {}): Promise<BuildTimeReport> {
  const siteRoot = options.siteRoot ?? join(root, "fixtures", FIXTURE);
  const themeRoot = options.themeRoot ?? join(root, "packages/theme");
  const out = options.out ?? join(root, ".tmp/build-time", `${process.pid}-${Date.now()}`);
  const budgetMs = options.budgetMs ?? BUDGET_MS;
  const ci = options.ci ?? onCI();
  const fixture = siteRoot.split(/[\\/]/).filter(Boolean).pop() ?? FIXTURE;

  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, ".."), { recursive: true });

  const began = performance.now();
  const result = await build({
    root: siteRoot,
    out,
    themeRoot,
    defaultLayout: DEFAULT_LAYOUT,
  });
  const totalMs = ms(performance.now() - began);

  // `build()` runs these two steps itself; timing them again is the only way to name them without the engine
  // reporting timings, and the engine is not this issue's to change.
  const modelMs = await timed(() => buildModel(siteRoot));
  const themeMs = await timed(() => loadRegistry(themeRoot));
  const renderMs = Math.max(0, totalMs - modelMs - themeMs);

  const pages = result.files.filter((file) => file.endsWith(".html")).length;
  const decision = verdict({ errors: buildErrors(result), totalMs, budgetMs, ci });

  return {
    fixture,
    pages,
    totalMs,
    budgetMs,
    stages: [
      { stage: "model", ms: modelMs },
      { stage: "theme", ms: themeMs },
      { stage: "render + write", ms: renderMs },
    ],
    problems: decision.problems,
    ok: decision.ok,
    warn: decision.warn,
  };
}

/** The report as lines: one header, a row per stage, a row per problem, and the verdict. */
export function formatReport(report: BuildTimeReport): string[] {
  const status = report.ok ? (report.warn ? "WARN" : "OK") : "FAIL";
  const lines = [
    `build-time: ${report.fixture}: ${report.pages} pages in ${report.totalMs} ms (budget ${report.budgetMs} ms)`,
    ...report.stages.map((stage) => `  ${stage.stage.padEnd(13)} ${String(stage.ms).padStart(6)} ms`),
    ...report.problems.map((problem) => `  ${problem}`),
  ];
  if (report.warn) lines.push("build-time: WARN — over budget; this fails on CI, not on a local run");
  lines.push(`build-time: ${status}`);
  return lines;
}

/** Parses `--budget <ms>`; anything else is ignored. */
export function budgetFrom(args: readonly string[]): number {
  const at = args.indexOf("--budget");
  if (at < 0) return BUDGET_MS;
  const value = Number(args[at + 1]);
  return Number.isFinite(value) && value > 0 ? value : BUDGET_MS;
}

/** Runs the gate once. Returns the exit code. */
export async function main(args: readonly string[] = process.argv.slice(2)): Promise<number> {
  const tmp = join(root, ".tmp/build-time");
  const out = join(tmp, `${process.pid}-${Date.now()}`);
  try {
    const report = await measure({ out, budgetMs: budgetFrom(args) });
    for (const line of formatReport(report)) console.log(line);
    return report.ok ? 0 : 1;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) process.exitCode = await main();
