// One command to migrate a Slipway 0.2 site (issue #1184): convert `_config.yml` to `mizzen.yml`,
// rewrite the front matter and callout includes of every page, check `_data/navigation.yml`, and print
// a report of every file changed and every step left for a person. With `--dry-run` it reads and
// reports only; nothing on disk changes.
//
//   node tools/migrate/run.ts <site> [--dry-run]
//   node tools/migrate/run.ts --help
//
// The mapping lives in config.ts and the page rewrite in content.ts (issues #1182 and #1183); this file
// walks the site and writes the files. With no site argument it prints its usage and exits 0, which is
// how `npm run check` runs every `tools/<name>/run.ts` without giving it one. When `engine.cli` lands,
// `npx slipway migrate [site]` calls `main()` here; until then this file is the command.
//
// The issue's Files list named `run.mjs`; AGENTS.md ("TypeScript only") and tools/ts-only require `.ts`.
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { migrateConfigFile, type MigrateProblem } from "./config.ts";
import { checkNavigation, migrateContent, type ContentNote } from "./content.ts";

export const USAGE = `Usage: node tools/migrate/run.ts <site> [--dry-run]

Migrate a Slipway 0.2 site to 0.3:
  _config.yml becomes mizzen.yml, and the 0.2 _config.yml is removed after a valid mizzen.yml is written.
  Every Markdown and HTML page has its front matter renamed and its callout includes turned into directives.
  _data/navigation.yml is checked against the engine's navigation schema and never rewritten.

Options:
  --dry-run   print the report without writing or removing anything
  -h, --help  show this message

The report lists every changed file and every manual step left. Exit codes: 0 when the migration ran,
1 when it could not (a parse failure or an invalid converted config), 2 for bad arguments.`;

/** A step a person must finish, or an error that stopped part of the migration. */
export type Step = { file: string; line?: number; note: string };

export type MigrationReport = {
  site: string;
  dryRun: boolean;
  /** Files written, or that a dry run would write, relative to the site, sorted. */
  changed: string[];
  /** Files removed, or that a dry run would remove, relative to the site, sorted. */
  removed: string[];
  /** Every remaining step, in the order the three steps found them. */
  manual: Step[];
  /** Failures that stopped a conversion; empty when every step ran. */
  errors: Step[];
};

/** Folders the engine does not read as content, plus build output and VCS metadata. */
const SKIP_DIRS = new Set(["node_modules", "vendor", "dist", "build", "coverage", "test-results"]);
const PAGE = /\.(md|html)$/i;
/** ADR 0006 twins are generated from a page; migrating them would report their own Liquid forever. */
const TWIN = /\.twin\.html$/i;

const posix = (path: string) => path.split(sep).join("/");

/**
 * Every page under `dir`, relative to `base`, sorted. The engine skips files and folders that start with
 * `_` or `.` (ADR 0024 rule 4), so the migration skips them too: `_includes` and `_layouts` are 0.2
 * machinery, not pages, and `_config.yml` is handled by the config step.
 */
export function pageFiles(dir: string, base = dir, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) pageFiles(full, base, found);
    } else if (entry.isFile() && PAGE.test(entry.name) && !TWIN.test(entry.name)) found.push(posix(relative(base, full)));
  }
  return found.sort();
}

const fromProblem = (file: string, problem: MigrateProblem): Step => ({
  file,
  note: problem.key ? `${problem.key}: ${problem.note}` : problem.note,
});

const fromNote = (note: ContentNote): Step => ({ file: note.file, line: note.line, note: note.note });

/** Moves `_config.yml` to `mizzen.yml` when the latter does not exist yet. */
function migrateConfigStep(site: string, dryRun: boolean, report: MigrationReport): void {
  const source = join(site, "_config.yml");
  const target = join(site, "mizzen.yml");
  const hasSource = existsSync(source);
  const hasTarget = existsSync(target);

  if (!hasSource) {
    if (!hasTarget) report.manual.push({ file: "_config.yml", note: "no _config.yml or mizzen.yml found; the engine builds with defaults" });
    return;
  }
  if (hasTarget) {
    report.manual.push({ file: "_config.yml", note: "mizzen.yml already exists; _config.yml was left in place" });
    return;
  }

  const result = migrateConfigFile(source);
  report.manual.push(...result.dropped.map((problem) => fromProblem("_config.yml", problem)));
  if (result.yaml === null) {
    report.errors.push(...result.errors.map((problem) => fromProblem("_config.yml", problem)));
    return;
  }
  if (result.errors.length > 0) {
    report.errors.push(...result.errors.map((problem) => fromProblem("_config.yml", problem)));
    return;
  }

  report.changed.push("mizzen.yml");
  report.removed.push("_config.yml");
  if (dryRun) return;
  try {
    writeFileSync(target, result.yaml, "utf8");
  } catch (error) {
    report.changed.pop();
    report.removed.pop();
    report.errors.push({ file: "_config.yml", note: error instanceof Error ? error.message : String(error) });
    return;
  }
  try {
    rmSync(source);
  } catch (error) {
    report.removed.pop();
    report.errors.push({ file: "_config.yml", note: error instanceof Error ? error.message : String(error) });
  }
}

/** Rewrites every page that changed; reports the Liquid and layouts it left alone. */
function migrateContentStep(site: string, dryRun: boolean, report: MigrationReport): void {
  for (const file of pageFiles(site)) {
    const full = join(site, file);
    try {
      const source = readFileSync(full, "utf8");
      const result = migrateContent(source, file);
      report.manual.push(...result.reports.map(fromNote));
      if (result.text === source) continue;
      if (!dryRun) writeFileSync(full, result.text, "utf8");
      report.changed.push(file);
    } catch (error) {
      report.errors.push({ file, note: error instanceof Error ? error.message : String(error) });
    }
  }
}

/** Checks the navigation file against the engine's schema; the file is never rewritten. */
function checkNavigationStep(site: string, report: MigrationReport): void {
  const file = "_data/navigation.yml";
  const full = join(site, file);
  if (!existsSync(full)) return;
  try {
    report.manual.push(...checkNavigation(readFileSync(full, "utf8"), file).map(fromNote));
  } catch (error) {
    report.errors.push({ file, note: error instanceof Error ? error.message : String(error) });
  }
}

/** Runs both migration steps on `site` and returns the report, writing only when `dryRun` is false. */
export function migrateSite(site: string, options: { dryRun?: boolean } = {}): MigrationReport {
  const report: MigrationReport = { site, dryRun: options.dryRun === true, changed: [], removed: [], manual: [], errors: [] };
  migrateConfigStep(site, report.dryRun, report);
  migrateContentStep(site, report.dryRun, report);
  checkNavigationStep(site, report);
  report.changed.sort();
  report.removed.sort();
  return report;
}

const location = (step: Step) => `${step.line === undefined ? step.file : `${step.file}:${step.line}`} — ${step.note}`;
const section = (title: string, lines: string[], empty = "none") => [
  `${title} (${lines.length})`,
  ...(lines.length > 0 ? lines.map((line) => `  ${line}`) : [`  ${empty}`]),
];

/** The text the command prints, and the shape a test asserts on. */
export function formatReport(report: MigrationReport): string {
  const write = report.dryRun ? "Would change" : "Changed files";
  const remove = report.dryRun ? "Would remove" : "Removed files";
  const lines = [
    "Slipway migration report",
    `site: ${report.site}`,
    `mode: ${report.dryRun ? "dry run (nothing was written)" : "write"}`,
    "",
    ...section(write, report.changed),
    "",
    ...section(remove, report.removed),
    "",
    ...section("Manual steps", report.manual.map(location)),
    "",
    ...section("Errors", report.errors.map(location)),
  ];
  return lines.join("\n");
}

export type Options = { dir?: string; dryRun: boolean; help: boolean };

/** Reads the command line; `--dry-run` may come before or after the directory. */
export function parseArgs(argv: string[]): Options {
  const options: Options = { dryRun: false, help: false };
  const dirs: string[] = [];
  for (const arg of argv) {
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "-h" || arg === "--help") options.help = true;
    else if (arg.startsWith("-")) throw new Error(`unknown option ${arg}`);
    else dirs.push(arg);
  }
  if (dirs.length > 1) throw new Error(`expected one site directory, got ${dirs.length}`);
  if (dirs[0] !== undefined) options.dir = dirs[0];
  return options;
}

/** The CLI. No directory prints the usage and exits 0 so `npm run check` can run this file as a check. */
export function main(argv: string[] = process.argv.slice(2), log = console.log, error = console.error): number {
  let options: Options;
  try {
    options = parseArgs(argv);
  } catch (failure) {
    error(`FAIL migrate: ${failure instanceof Error ? failure.message : String(failure)}\n\n${USAGE}`);
    return 2;
  }
  if (options.help || options.dir === undefined) {
    log(USAGE);
    if (!options.help) log("\nNothing was migrated: give the site directory, for example `node tools/migrate/run.ts examples/product-docs`.");
    return 0;
  }

  const site = resolve(options.dir);
  if (!existsSync(site) || !statSync(site).isDirectory()) {
    error(`FAIL migrate: ${options.dir} is not a directory`);
    return 1;
  }

  const report = migrateSite(site, { dryRun: options.dryRun });
  log(formatReport(report));
  return report.errors.length > 0 ? 1 : 0;
}

const invoked = process.argv[1] === undefined ? null : pathToFileURL(process.argv[1]).href;
if (invoked === import.meta.url) process.exitCode = main();
