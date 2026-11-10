// Deterministic gate (issues #1148, #1572): build the same fixture twice, each into its own temp folder, and fail on
// the first file whose bytes differ, naming the byte offset. Both builds see one fixed SOURCE_DATE_EPOCH, so an output
// that stamps a time still matches; a build that reads the clock, a random source, or its own output path fails here
// instead of shipping.
//
//   node tools/deterministic/run.ts [--allow <file>] [fixture...]
//
// A difference the gate may tolerate goes in an allow file (default `tools/deterministic/allow.txt`): one
// repository-relative path per line, blank lines and `#` comments ignored. Every allowed difference is printed, and an
// entry that matches no difference is reported as stale, so the file can never hide something silently.
//
// The builds go through the shared fixture helper (#1146), each with its own cache folder so neither build can reuse
// the other's output. The two folders are removed whatever the result. `npm run check` runs this file; the message
// names the first differing file and byte offset, and the exit code is 1.
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

/** The allow file the gate reads when the command line names none, relative to the repository root. */
export const DEFAULT_ALLOW_FILE = "tools/deterministic/allow.txt";

/** How two builds disagree about one file: its bytes differ, or only one build writes it. */
export type Difference =
  | {
      /** The file, relative to the output folder with `/` separators. */
      readonly path: string;
      readonly kind: "changed";
      /**
       * The zero-based offset of the first byte that differs, or the length of the shorter file when one is a prefix of
       * the other.
       */
      readonly offset: number;
    }
  | {
      /** The file, relative to the output folder with `/` separators. */
      readonly path: string;
      readonly kind: "only-in-first" | "only-in-second";
    };

/** A difference an entry in the allow file covers. */
export interface AllowedDifference {
  readonly fixture: FixtureName;
  readonly difference: Difference;
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
  /**
   * Allow file to read, relative to `root` or absolute. Default: {@link DEFAULT_ALLOW_FILE}, and a missing default file
   * means no entry is allowed. An allow file named here must exist.
   */
  readonly allowFile?: string;
}

/** What {@link deterministic} found, with every allowed difference and every allow entry that matched nothing. */
export type DeterministicResult =
  | (DeterministicSummary & { readonly kind: "identical" })
  | (DeterministicSummary & { readonly kind: "differs"; readonly fixture: FixtureName; readonly difference: Difference })
  | (DeterministicSummary & { readonly kind: "stale" });

/** The fields every {@link DeterministicResult} carries, whatever the outcome. */
export interface DeterministicSummary {
  /** The fixtures compared, in the order they were checked. */
  readonly fixtures: readonly FixtureName[];
  /** The allow file that was read, as named; absent when the default file does not exist. */
  readonly allowFile?: string;
  /** Differences an allow entry covers, in fixture and path order. */
  readonly allowed: readonly AllowedDifference[];
  /** Allow entries for a checked fixture that matched no difference, in file order. */
  readonly stale: readonly string[];
}

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

/** The offset of the first byte where two buffers differ: their shorter length when one is a prefix of the other. */
export function firstDifferingByte(a: Buffer, b: Buffer): number {
  const length = Math.min(a.length, b.length);
  let offset = 0;
  while (offset < length && a[offset] === b[offset]) offset++;
  return offset;
}

/** Every file whose bytes differ between the two output folders, in path order. */
export async function differences(first: string, second: string): Promise<Difference[]> {
  const left = await filesUnder(first);
  const right = await filesUnder(second);
  const inFirst = new Set(left);
  const inSecond = new Set(right);
  const found: Difference[] = [];

  for (const path of [...new Set([...left, ...right])].sort(byCodePoint)) {
    if (!inSecond.has(path)) {
      found.push({ path, kind: "only-in-first" });
      continue;
    }
    if (!inFirst.has(path)) {
      found.push({ path, kind: "only-in-second" });
      continue;
    }
    const [a, b] = await Promise.all([readFile(join(first, path)), readFile(join(second, path))]);
    if (!a.equals(b)) found.push({ path, kind: "changed", offset: firstDifferingByte(a, b) });
  }
  return found;
}

/** The first file whose bytes differ between the two output folders, if any. */
export async function firstDifference(first: string, second: string): Promise<Difference | undefined> {
  return (await differences(first, second))[0];
}

/**
 * The paths in an allow file: one repository-relative path per line, as printed in the message
 * (`fixtures/<fixture>/<path>`). Blank lines and `#` comments are ignored; absolute paths, `..` segments, backslashes,
 * and duplicates are rejected, because an entry that does not name exactly one path can never match.
 */
export function parseAllow(text: string): string[] {
  const entries: string[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;
    if (line.startsWith("/") || line.includes("\\") || line.split("/").includes("..")) {
      throw new TypeError(
        `deterministic: allow entry "${line}" is not a repository-relative path with "/" separators.`,
      );
    }
    if (seen.has(line)) throw new TypeError(`deterministic: allow entry "${line}" is listed more than once.`);
    seen.add(line);
    entries.push(line);
  }
  return entries;
}

/** Reads the allow file; a missing default means no allows, a missing explicitly named file is an error. */
async function readAllow(
  repo: string,
  allowFile: string | undefined,
): Promise<{ entries: string[]; used: string | undefined }> {
  const named = allowFile ?? DEFAULT_ALLOW_FILE;
  const path = resolve(repo, named);
  try {
    return { entries: parseAllow(await readFile(path, "utf8")), used: named };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    if (allowFile !== undefined) throw new TypeError(`deterministic: allow file not found: ${path}.`);
    return { entries: [], used: undefined };
  }
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
 * Builds every fixture twice, in two different output folders, and compares the bytes. Differences an allow entry
 * covers are collected and differences without one fail the run at the first such file. Every fixture is still built
 * after a difference, so an allow entry is only called stale when it really matched nothing. A failed build throws, as
 * it does from the shared helper.
 */
export async function deterministic(options: DeterministicOptions = {}): Promise<DeterministicResult> {
  const repo = resolve(options.root ?? root);
  const fixtures = options.fixtures ?? FIXTURES;
  for (const name of fixtures) {
    if (!FIXTURES.includes(name)) {
      throw new TypeError(`deterministic: unknown fixture "${name}"; expected ${FIXTURES.join(" or ")}.`);
    }
  }

  const allow = await readAllow(repo, options.allowFile);
  const permits = new Set(allow.entries);
  const used = new Set<string>();
  const allowed: AllowedDifference[] = [];
  let failure: { fixture: FixtureName; difference: Difference } | undefined;

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

      for (const difference of await differences(first, second)) {
        const entry = `fixtures/${name}/${difference.path}`;
        if (permits.has(entry)) {
          used.add(entry);
          allowed.push({ fixture: name, difference });
        } else if (failure === undefined) {
          failure = { fixture: name, difference };
        }
      }
    }
  } finally {
    await rm(work, { recursive: true, force: true });
  }

  // Only entries for the fixtures compared can be called stale: an entry for another fixture was not checked.
  const stale = allow.entries.filter(
    (entry) => fixtures.some((name) => entry.startsWith(`fixtures/${name}/`)) && !used.has(entry),
  );
  const summary: DeterministicSummary = {
    fixtures: [...fixtures],
    allowed,
    stale,
    ...(allow.used === undefined ? {} : { allowFile: allow.used }),
  };
  if (failure !== undefined) return { ...summary, kind: "differs", ...failure };
  if (stale.length > 0) return { ...summary, kind: "stale" };
  return { ...summary, kind: "identical" };
}

export const USAGE = `Usage: node tools/deterministic/run.ts [--allow <file>] [fixture...]

Build each fixture twice, each into its own temp folder, and fail when any byte differs. Both builds see the fixed
SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}. Without arguments it checks ${FIXTURES.join(" and ")}.

An allow file lists repository-relative paths that may differ, one per line, with # comments. The default is
${DEFAULT_ALLOW_FILE}, and a missing default file allows nothing; --allow <file> reads another file. Every allowed
difference is printed, and an entry that matches no difference is stale and fails the run.

Exit codes: 0 when no difference is unexplained, 1 on one that is, a stale allow entry, or a failed build, 2 for bad
arguments.`;

/** How a difference is described, without its path: changed at a byte, or written by one build only. */
export function describeDifference(difference: Difference): string {
  switch (difference.kind) {
    case "changed":
      return `differs between two builds at byte offset ${difference.offset} (zero-based)`;
    case "only-in-first":
      return "is written by the first build only";
    case "only-in-second":
      return "is written by the second build only";
  }
}

/** One sentence a person can act on: which file differed and how. */
export function differenceMessage(fixture: FixtureName, difference: Difference): string {
  return `deterministic: fixtures/${fixture}/${difference.path}: ${describeDifference(difference)}.`;
}

/** One line per allowed difference, so an allow entry never hides anything. */
export function allowedMessages(
  allowed: readonly AllowedDifference[],
  allowFile: string | undefined,
): string[] {
  const source = allowFile ?? DEFAULT_ALLOW_FILE;
  return allowed.map(
    ({ fixture, difference }) =>
      `deterministic: allowed by ${source}: fixtures/${fixture}/${difference.path} ${describeDifference(difference)}.`,
  );
}

/** One line per allow entry that matched no difference. */
export function staleMessages(stale: readonly string[], allowFile: string | undefined): string[] {
  const source = allowFile ?? DEFAULT_ALLOW_FILE;
  return stale.map(
    (entry) => `deterministic: stale allow entry in ${source}: ${entry} matches no difference; remove it.`,
  );
}

/** What the command line asks for: help, a run, or an argument error. */
export type CliArguments =
  | { readonly kind: "help" }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "run"; readonly fixtures: readonly FixtureName[]; readonly allowFile?: string };

/** Reads the command line: fixtures by name, one optional `--allow <file>` (also `--allow=<file>`). */
export function parseArguments(argv: readonly string[]): CliArguments {
  const fixtures: FixtureName[] = [];
  let allowFile: string | undefined;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]!;
    if (arg === "-h" || arg === "--help") return { kind: "help" };

    let value: string | undefined;
    if (arg === "--allow") value = argv[++index];
    else if (arg.startsWith("--allow=")) value = arg.slice("--allow=".length);
    if (value !== undefined || arg === "--allow") {
      if (value === undefined || value === "" || value.startsWith("-")) {
        return { kind: "error", message: "--allow needs a file path." };
      }
      if (allowFile !== undefined) return { kind: "error", message: "--allow is given more than once." };
      allowFile = value;
      continue;
    }

    if (arg.startsWith("-")) return { kind: "error", message: `unknown option "${arg}".` };
    if (!FIXTURES.includes(arg as FixtureName)) {
      return { kind: "error", message: `unknown fixture "${arg}"; expected ${FIXTURES.join(" or ")}.` };
    }
    if (!fixtures.includes(arg as FixtureName)) fixtures.push(arg as FixtureName);
  }

  const chosen = fixtures.length === 0 ? [...FIXTURES] : fixtures;
  return allowFile === undefined
    ? { kind: "run", fixtures: chosen }
    : { kind: "run", fixtures: chosen, allowFile };
}

/** The CLI. `npm run check` runs this file with no arguments and checks the exit code. */
export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const parsed = parseArguments(argv);
  if (parsed.kind === "help") {
    console.log(USAGE);
    return 0;
  }
  if (parsed.kind === "error") {
    console.error(`deterministic: ${parsed.message}`);
    console.error(USAGE);
    return 2;
  }

  try {
    const result = await deterministic({ fixtures: parsed.fixtures, allowFile: parsed.allowFile });
    if (result.kind === "differs") {
      console.error(differenceMessage(result.fixture, result.difference));
      for (const line of allowedMessages(result.allowed, result.allowFile)) console.error(line);
      for (const line of staleMessages(result.stale, result.allowFile)) console.error(line);
      console.error("A build that depends on the clock, a random value, or its output path cannot be reproduced.");
      return 1;
    }
    if (result.kind === "stale") {
      for (const line of staleMessages(result.stale, result.allowFile)) console.error(line);
      console.error("A stale entry allows nothing; remove it so the allow file stays honest.");
      return 1;
    }
    for (const line of allowedMessages(result.allowed, result.allowFile)) console.log(line);
    const outcome =
      result.allowed.length === 0
        ? "byte-identical"
        : `${result.allowed.length} allowed difference(s) listed above, none unexplained`;
    console.log(`deterministic: ok (${result.fixtures.join(", ")} built twice; ${outcome})`);
    return 0;
  } catch (error) {
    console.error(`deterministic: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

const invoked = process.argv[1] === undefined ? null : pathToFileURL(process.argv[1]).href;
if (invoked === import.meta.url) process.exitCode = await main();
