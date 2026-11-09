// Deterministic gate (issue #1148): build the same fixture twice, each into its own temp folder, and fail on the first
// file whose bytes differ. Both builds see one fixed SOURCE_DATE_EPOCH, so an output that stamps a time still matches;
// a build that reads the clock, a random source, or its own output path fails here instead of shipping.
//
//   node tools/deterministic/run.ts [fixture...]    compare two builds of each fixture (default: every fixture)
//
// The builds go through the shared fixture helper (#1146), each with its own cache folder so neither build can reuse
// the other's output. The two folders are removed whatever the result. `npm run check` runs this file; the message
// names the first differing file and the exit code is 1.
import { mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  builtSite,
  FIXTURES,
  root,
  type FixtureBuilder,
  type FixtureName,
} from "../fixture-build/build.ts";

/** The fixed time both builds see, in seconds since the Unix epoch: 2026-01-01T00:00:00Z. */
export const SOURCE_DATE_EPOCH = "1767225600";

/** How two builds can disagree about a path. */
export type DifferenceKind = "changed" | "only-in-first" | "only-in-second";

/** The first path that differs between two builds and how they disagree. */
export interface Difference {
  /** The file, relative to the output folder with `/` separators. */
  readonly path: string;
  readonly kind: DifferenceKind;
}

/** Options of {@link deterministic}. Every field has a default; the tests set them. */
export interface DeterministicOptions {
  /** Repository root that holds `fixtures/`, `packages/`, and `.tmp/`. Default: this repository. */
  readonly root?: string;
  /** Fixtures to build twice. Default: every fixture the shared helper knows. */
  readonly fixtures?: readonly FixtureName[];
  /** Folder that holds the two scratch builds. Default: `<root>/.tmp`. */
  readonly workDir?: string;
  /** The build to run. Default: the engine's `build`. */
  readonly build?: FixtureBuilder;
}

/** What {@link deterministic} found: both builds are identical, or one fixture differs. */
export type DeterministicResult =
  | { readonly kind: "identical"; readonly fixtures: readonly FixtureName[] }
  | { readonly kind: "differs"; readonly fixture: FixtureName; readonly difference: Difference };

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Every file under `dir`, relative to it with `/`, in path order. Symlinks are ignored. */
async function filesUnder(dir: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    found.push(relative(dir, join(entry.parentPath, entry.name)).split(sep).join("/"));
  }
  return found.sort(byCodePoint);
}

/** The first file whose bytes differ between the two output folders, if any. */
export async function firstDifference(first: string, second: string): Promise<Difference | undefined> {
  const left = await filesUnder(first);
  const right = await filesUnder(second);
  const inFirst = new Set(left);
  const inSecond = new Set(right);

  for (const path of [...new Set([...left, ...right])].sort(byCodePoint)) {
    if (!inSecond.has(path)) return { path, kind: "only-in-first" };
    if (!inFirst.has(path)) return { path, kind: "only-in-second" };
    const [a, b] = await Promise.all([readFile(join(first, path)), readFile(join(second, path))]);
    if (!a.equals(b)) return { path, kind: "changed" };
  }
  return undefined;
}

/** Runs `build` with one fixed SOURCE_DATE_EPOCH, then puts the environment back as it was. */
async function withSourceDateEpoch<T>(build: () => Promise<T>): Promise<T> {
  const previous = process.env.SOURCE_DATE_EPOCH;
  process.env.SOURCE_DATE_EPOCH = SOURCE_DATE_EPOCH;
  try {
    return await build();
  } finally {
    if (previous === undefined) delete process.env.SOURCE_DATE_EPOCH;
    else process.env.SOURCE_DATE_EPOCH = previous;
  }
}

/**
 * Builds every fixture twice, in two different output folders, and compares the bytes. Stops at the first fixture
 * with a difference and names its first differing file. A failed build throws, as it does from the shared helper.
 */
export async function deterministic(options: DeterministicOptions = {}): Promise<DeterministicResult> {
  const repo = resolve(options.root ?? root);
  const fixtures = options.fixtures ?? FIXTURES;
  for (const name of fixtures) {
    if (!FIXTURES.includes(name)) {
      throw new TypeError(`deterministic: unknown fixture "${name}"; expected ${FIXTURES.join(" or ")}.`);
    }
  }

  const base = resolve(options.workDir ?? join(repo, ".tmp"));
  await mkdir(base, { recursive: true });
  const work = await mkdtemp(join(base, "deterministic-"));
  try {
    for (const name of fixtures) {
      const [first, second] = await withSourceDateEpoch(async () => {
        const first = await builtSite(name, {
          root: repo,
          cacheDir: join(work, name, "first"),
          build: options.build,
        });
        const second = await builtSite(name, {
          root: repo,
          cacheDir: join(work, name, "second"),
          build: options.build,
        });
        return [first, second] as const;
      });

      const difference = await firstDifference(first, second);
      if (difference !== undefined) return { kind: "differs", fixture: name, difference };
    }
    return { kind: "identical", fixtures: [...fixtures] };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

export const USAGE = `Usage: node tools/deterministic/run.ts [fixture...]

Build each fixture twice, each into its own temp folder, and fail when any byte differs. Both builds see the fixed
SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}. Without arguments it checks ${FIXTURES.join(" and ")}.

Exit codes: 0 when every pair is byte-identical, 1 on a difference or a failed build, 2 for bad arguments.`;

/** One sentence a person can act on: which file differed and how. */
export function differenceMessage(fixture: FixtureName, difference: Difference): string {
  const how =
    difference.kind === "changed"
      ? "differs between two builds"
      : difference.kind === "only-in-first"
        ? "is written by the first build only"
        : "is written by the second build only";
  return `deterministic: fixtures/${fixture}: ${difference.path} ${how} (first differing file by path).`;
}

/** The CLI. `npm run check` runs this file with no arguments and checks the exit code. */
export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  if (argv.includes("-h") || argv.includes("--help")) {
    console.log(USAGE);
    return 0;
  }

  const unknown = argv.filter((arg) => !FIXTURES.includes(arg as FixtureName));
  if (unknown.length > 0) {
    console.error(`deterministic: unknown fixture ${unknown.join(", ")}; expected ${FIXTURES.join(" or ")}.`);
    return 2;
  }
  const fixtures = argv.length === 0 ? [...FIXTURES] : (argv as FixtureName[]);

  try {
    const result = await deterministic({ fixtures });
    if (result.kind === "differs") {
      console.error(differenceMessage(result.fixture, result.difference));
      console.error("A build that depends on the clock, a random value, or its output path cannot be reproduced.");
      return 1;
    }
    console.log(`deterministic: ok (${fixtures.join(", ")} built twice, byte-identical)`);
    return 0;
  } catch (error) {
    console.error(`deterministic: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

const invoked = process.argv[1] === undefined ? null : pathToFileURL(process.argv[1]).href;
if (invoked === import.meta.url) process.exitCode = await main();
