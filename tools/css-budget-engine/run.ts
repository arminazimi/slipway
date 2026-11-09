// The engine's CSS budget: every stylesheet the site ships, Brotli-compressed, weighs at most 40 KB together.
//
//   node tools/css-budget-engine/run.ts             build both fixtures and check them
//   node tools/css-budget-engine/run.ts <build>     check one engine build folder
//
// The site loads one shared theme bundle plus the bundles its units need, and a few assets of its own, so the
// budget is the sum of what the whole build ships rather than a per-page figure. Every `*.css` file in the build
// folder counts, whether the theme, an output, or the site itself wrote it: a stylesheet a page does not link yet
// is still weight a later page can add, and counting files rather than `<link>` tags cannot miss one. Each file is
// compressed with Brotli at its maximum quality, the same stream a static host writes, so the total is what a
// browser would download on the best day. The report lists the largest files so a failure names what to shrink.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { brotliCompressSync, constants } from "node:zlib";
import { builtSite, FIXTURES, type FixtureName } from "../fixture-build/build.ts";

/** The ceiling for the whole site: 40 KiB of compressed CSS. */
export const budgetBytes = 40 * 1024;

/** Folders that never hold a stylesheet the site ships. */
const SKIP_DIRS = new Set(["node_modules", ".git", ".tmp"]);

/** One stylesheet in the build, with its compressed and raw sizes in bytes. */
export interface StylesheetUse {
  /** Build-relative path, with `/` separators. */
  readonly name: string;
  /** Brotli-compressed size. */
  readonly bytes: number;
  /** Size before compression. */
  readonly raw: number;
}

/** What one build folder costs. */
export interface SiteBudget {
  /** Every stylesheet, largest first. */
  readonly files: readonly StylesheetUse[];
  /** The compressed bytes of every stylesheet the site ships. */
  readonly bytes: number;
  /** Problems that stopped the gate from measuring the build. */
  readonly problems: readonly string[];
}

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Brotli's best compression, the same stream a static host writes. */
export function compressedBytes(source: Buffer | string): number {
  const data = typeof source === "string" ? Buffer.from(source) : source;
  return brotliCompressSync(data, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
      [constants.BROTLI_PARAM_SIZE_HINT]: data.length,
    },
  }).length;
}

/** A build-relative path with `/` separators, the way HTML and URLs write it. */
function buildPath(file: string, root: string): string {
  return relative(root, file).split(sep).join("/");
}

/** Every stylesheet under `dir`, sorted by path. */
function cssFiles(dir: string): string[] {
  const found: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(current, entry.name));
      } else if (entry.isFile() && entry.name.endsWith(".css")) {
        found.push(join(current, entry.name));
      }
    }
  };
  walk(dir);
  return found.sort(byCodePoint);
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Measures every stylesheet in one engine build folder. */
export function budget(dir: string): SiteBudget {
  const root = resolve(dir);
  if (!existsSync(root)) return { files: [], bytes: 0, problems: [`${root} does not exist`] };
  if (!statSync(root).isDirectory()) return { files: [], bytes: 0, problems: [`${root} is not a directory`] };

  const problems: string[] = [];
  const files: StylesheetUse[] = [];
  for (const file of cssFiles(root)) {
    try {
      const data = readFileSync(file);
      const name = buildPath(file, root);
      files.push({ name, bytes: compressedBytes(data), raw: data.length });
    } catch (err) {
      problems.push(`cannot read "${buildPath(file, root)}": ${message(err)}`);
    }
  }

  files.sort((a, b) => b.bytes - a.bytes || byCodePoint(a.name, b.name));
  const bytes = files.reduce((total, file) => total + file.bytes, 0);
  if (files.length === 0) problems.push(`${root} has no CSS files`);
  return { files, bytes, problems };
}

/** Prints a build's result and says whether it passed. */
function report(label: string, site: SiteBudget): boolean {
  if (site.problems.length > 0) {
    console.error(`FAIL: CSS budget ${label}: ${site.problems.length} problem(s)`);
    for (const problem of site.problems) console.error(`  ${problem}`);
  }
  if (site.bytes > budgetBytes) {
    console.error(`FAIL: CSS budget ${label}: ${site.bytes} of ${budgetBytes} compressed bytes (${site.files.length} stylesheets)`);
    for (const file of site.files.slice(0, 5)) console.error(`  ${file.name} ${file.bytes} compressed (${file.raw} raw)`);
  }
  if (site.problems.length > 0 || site.bytes > budgetBytes) return false;

  const largest = site.files[0];
  const file = largest === undefined ? "none" : `${largest.name} ${largest.bytes} bytes`;
  console.log(`OK: CSS budget ${label} (${site.bytes} of ${budgetBytes} compressed bytes across ${site.files.length} stylesheets; largest ${file})`);
  return true;
}

/** Runs the gate on both fixtures, or on one build folder when one is given. */
export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const one = argv[0];
  if (one !== undefined) return report(one, budget(one)) ? 0 : 1;

  let passed = true;
  for (const name of FIXTURES as readonly FixtureName[]) {
    let dir: string;
    try {
      dir = await builtSite(name);
    } catch (err) {
      console.error(`FAIL: CSS budget ${name}: ${message(err)}`);
      return 1;
    }
    if (!report(name, budget(dir))) passed = false;
  }
  return passed ? 0 : 1;
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
