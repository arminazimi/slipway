// Shared fixture build for the gates (issue #1146): one engine build of each fixture per run, reused across runs while
// the inputs are unchanged.
//
//   import { builtSite } from "../fixture-build/build.ts";
//   const docs = await builtSite("docs-site");
//   // docs is a complete engine build of fixtures/docs-site, ready for a gate to read.
//
// Every gate tests the same two fixtures (`fixtures/docs-site` and `fixtures/rtl-site`), so it builds them through this
// helper instead of building its own copy. The build lands in `.tmp/fixture-build/<name>` (gitignored). Next to it, a
// state file records the hash of the inputs (the fixture, the engine's source, the theme, and the lockfile); a later run
// with the same hash reuses the folder instead of building again. A lock folder keeps two processes from building the
// same fixture at once. The gates read the folder and never write to it.
import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { build, type BuildOptions, type BuildResult } from "../../packages/engine/src/pipeline/build.ts";

/** The repository root: this file sits three levels below it. */
export const root = join(fileURLToPath(import.meta.url), "../../..");

/** The fixtures every gate builds, by folder name under `fixtures/`. */
export const FIXTURES = ["docs-site", "rtl-site"] as const;

/** A fixture this helper knows how to build. */
export type FixtureName = (typeof FIXTURES)[number];

/** Layout for a page that names none; the engine CLI's default (`mizzen build`). */
const DEFAULT_LAYOUT = "doc";

/** Bumped when the meaning of the cache changes, so old folders are rebuilt rather than trusted. */
const CACHE_VERSION = 1;

/** Folders that never affect a build, skipped while hashing. */
const SKIP_DIRS = new Set(["node_modules", ".git", "dist"]);

/** A lock older than this belongs to a crashed run and may be taken over. */
const STALE_LOCK_MS = 10 * 60 * 1000;

/** How long to wait for another process's build before giving up. */
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

/** Builds one fixture; the tests replace it with a recorder. */
export type FixtureBuilder = (options: BuildOptions) => Promise<BuildResult>;

/** Where and how {@link builtSite} builds. Every field has a default; the tests set them. */
export interface FixtureBuildOptions {
  /** Repository root that holds `fixtures/`, `packages/`, and `.tmp/`. Default: this repository. */
  readonly root?: string;
  /** Folder that holds `<name>/` and its state. Default: `<root>/.tmp/fixture-build`. */
  readonly cacheDir?: string;
  /** The build to run. Default: the engine's `build`. */
  readonly build?: FixtureBuilder;
}

/** Builds already started or finished in this process, by cache folder and fixture, so a run builds each fixture once. */
const started = new Map<string, Promise<string>>();

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Every file under `dir`, skipping folders that cannot affect a build. Symlinks are ignored. */
async function filesUnder(dir: string, found: string[] = []): Promise<string[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await filesUnder(path, found);
    else if (entry.isFile()) found.push(path);
  }
  return found;
}

/** The paths whose contents change a fixture's build. */
function inputsOf(name: FixtureName): string[] {
  return [`fixtures/${name}`, "packages/engine/src", "packages/engine/schema", "packages/theme", "package-lock.json"];
}

/**
 * Hashes everything a build of `name` under `repo` depends on: the fixture's files, the engine's source, the theme, and
 * the lockfile. Paths, sizes, and contents count; timestamps do not, so a checkout gives the same hash.
 */
export async function inputHash(repo: string, name: FixtureName): Promise<string> {
  const hash = createHash("sha256");
  hash.update(`fixture-build ${CACHE_VERSION}\n`);
  for (const rel of inputsOf(name)) {
    const path = join(repo, rel);
    if (!existsSync(path)) continue;
    const files = statSync(path).isFile() ? [path] : (await filesUnder(path)).sort(byCodePoint);
    for (const file of files) {
      const key = relative(repo, file).split(sep).join("/");
      hash.update(key);
      hash.update("\0");
      hash.update(String(statSync(file).size));
      hash.update("\0");
      hash.update(await readFile(file));
      hash.update("\0");
    }
  }
  return hash.digest("hex");
}

/** True when the state file was written by this version for this hash and the output folder is still there. */
async function current(statePath: string, hash: string, out: string): Promise<boolean> {
  try {
    const state = JSON.parse(await readFile(statePath, "utf8")) as { version?: unknown; hash?: unknown };
    return state.version === CACHE_VERSION && state.hash === hash && existsSync(out);
  } catch {
    return false;
  }
}

/** Records the inputs of a finished build, written whole so a reader never sees half a file. */
async function record(statePath: string, hash: string): Promise<void> {
  const temp = `${statePath}.${process.pid}.tmp`;
  await writeFile(temp, `${JSON.stringify({ version: CACHE_VERSION, hash })}\n`);
  await rename(temp, statePath);
}

/** Takes `lock` as a folder (atomic on every filesystem), waiting while another process builds. */
async function acquire(lock: string): Promise<void> {
  const began = Date.now();
  for (;;) {
    try {
      await mkdir(lock);
      return;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      let age = 0;
      try {
        age = Date.now() - (await stat(lock)).mtimeMs;
      } catch {
        continue; // Released between mkdir and stat: try again.
      }
      if (age > STALE_LOCK_MS) {
        await rm(lock, { recursive: true, force: true });
        continue;
      }
      if (Date.now() - began > LOCK_TIMEOUT_MS) {
        throw new Error(`fixture-build: timed out waiting for another build ("${lock}").`);
      }
      await delay(50);
    }
  }
}

/** Builds `name` into `cacheDir`, or reuses the folder when its inputs are unchanged. */
async function prepare(name: FixtureName, options: Required<Pick<FixtureBuildOptions, "root" | "cacheDir" | "build">>): Promise<string> {
  if (!FIXTURES.includes(name)) {
    throw new TypeError(`fixture-build: unknown fixture "${name}"; expected ${FIXTURES.join(" or ")}.`);
  }

  const out = join(options.cacheDir, name);
  const statePath = join(options.cacheDir, `${name}.state.json`);
  const lock = join(options.cacheDir, `${name}.lock`);
  await mkdir(options.cacheDir, { recursive: true });

  const hash = await inputHash(options.root, name);
  if (await current(statePath, hash, out)) return out;

  await acquire(lock);
  try {
    // Another process may have finished the same build while this one waited.
    if (await current(statePath, hash, out)) return out;

    const result = await options.build({
      root: join(options.root, "fixtures", name),
      out,
      themeRoot: join(options.root, "packages/theme"),
      defaultLayout: DEFAULT_LAYOUT,
    });
    const errors = result.diagnostics.filter((d) => d.severity === "error");
    if (errors.length > 0) {
      const lines = errors.map((d) => `  ${d.id}: ${d.message}`);
      throw new Error(`fixture-build: the ${name} fixture has ${errors.length} build error(s):\n${lines.join("\n")}`);
    }

    await record(statePath, hash);
    return out;
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}

/**
 * The output folder of `fixtures/<name>`, built with the engine once per run and reused across runs while the inputs
 * are unchanged. Calls in one run share one build, even when they happen at the same time.
 */
export function builtSite(name: FixtureName, options: FixtureBuildOptions = {}): Promise<string> {
  const repo = resolve(options.root ?? root);
  const cacheDir = resolve(options.cacheDir ?? join(repo, ".tmp/fixture-build"));
  const key = `${cacheDir}\0${name}`;

  const running = started.get(key);
  if (running !== undefined) return running;

  const job = prepare(name, { root: repo, cacheDir, build: options.build ?? build });
  started.set(key, job);
  // A failed build is not remembered: the next call checks the cache and tries again.
  job.catch(() => {
    if (started.get(key) === job) started.delete(key);
  });
  return job;
}

/** Forgets the builds of this process, so the next call checks the cache on disk again. Only tests need this. */
export function resetFixtureBuilds(): void {
  started.clear();
}
