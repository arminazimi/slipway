// `node tools/twins/run.ts`: the Markdown twins of a built site (ADR 0006), written by the engine.
//
//   node tools/twins/run.ts                            build fixtures/docs-site's twins into .tmp/twins/docs-site
//   node tools/twins/run.ts --site rtl-site            the other build fixture
//   node tools/twins/run.ts --out <dir>                write them somewhere else
//
// The engine writes every page's twin next to its HTML (`packages/engine/src/outputs/twins.ts`): `<url>/index.md` for a
// pretty URL, `index.md` at the site root, `404.md` for a URL that names `404.html`, and nothing for an app page. This
// tool does not derive that naming or the page text a second time: it builds the fixture through the engine, reads the
// build's `.slipway/manifest.json`, and copies the twin each page names into a folder of its own, so a caller that wants
// only the Markdown (an agent, a docs mirror, a test) does not have to filter the HTML out of the build.
//
// It replaces the Ruby/Jekyll generator that `npm run twins` used to call: on the engine there are no stub pages to
// commit, because a twin is an output file like every other. The folder is tool-owned: a `.md` file it wrote on an
// earlier run and no longer writes is removed, and every other file is left alone.
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { builtSite, FIXTURES, type FixtureName } from "../fixture-build/build.ts";
import { root } from "../root.ts";

/** The fixture a run without `--site` builds. */
export const DEFAULT_FIXTURE: FixtureName = "docs-site";

/** Where a run without `--out` writes the twins of `fixture`, relative to the repository root. */
export function defaultOut(repo: string, fixture: FixtureName): string {
  return join(repo, ".tmp/twins", fixture);
}

/** A page's Markdown twin: the page's URL, its file path in the output folder, and its text. */
export interface Twin {
  /** The page URL, including the site `base`. */
  readonly url: string;
  /** The twin's path relative to the output folder, using `/`, such as `guide/install/index.md`. */
  readonly path: string;
  /** The page's Markdown, front matter removed: the bytes the engine wrote. */
  readonly contents: string;
}

/** The part of `.slipway/manifest.json` this tool reads. */
interface Manifest {
  readonly pages?: readonly ManifestPage[];
}

/** One page of the manifest: its URL and the files the enabled outputs wrote for it. */
interface ManifestPage {
  readonly url?: unknown;
  readonly outputs?: unknown;
}

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Reads the manifest of a build, naming the build when it is missing or unreadable. */
async function readManifest(built: string): Promise<Manifest> {
  const file = join(built, ".slipway/manifest.json");
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch {
    throw new Error(`twins: ${built} has no .slipway/manifest.json; build the site with the engine first.`);
  }
  try {
    return JSON.parse(text) as Manifest;
  } catch {
    throw new Error(`twins: ${file} is not valid JSON.`);
  }
}

/**
 * The Markdown twins of a build, from its manifest: one entry per page whose outputs name a `.md` file, sorted by path.
 * The paths and the text are the engine's (`outputs/twins.ts`), never recomputed here, so the list always agrees with
 * what the build wrote. A page with no twin, such as an app page, contributes nothing.
 */
export async function twinFiles(built: string): Promise<Twin[]> {
  const manifest = await readManifest(built);
  if (!Array.isArray(manifest.pages)) throw new Error(`twins: ${join(built, ".slipway/manifest.json")} has no pages.`);

  const twins: Twin[] = [];
  for (const page of manifest.pages) {
    if (typeof page?.url !== "string" || !Array.isArray(page.outputs)) {
      throw new Error(`twins: ${join(built, ".slipway/manifest.json")} has a page without a URL or outputs.`);
    }
    const path = (page.outputs as unknown[]).find((output): output is string => typeof output === "string" && output.endsWith(".md"));
    if (path === undefined) continue;
    let contents: string;
    try {
      contents = await readFile(join(built, path), "utf8");
    } catch {
      throw new Error(`twins: the manifest lists "${path}" for ${page.url}, but the build did not write it.`);
    }
    twins.push({ url: page.url, path, contents });
  }
  return twins.sort((a, b) => byCodePoint(a.path, b.path));
}

/** Every `.md` file under `dir`, relative to it with `/` separators. An absent folder has none. */
async function markdownUnder(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const entry of await readdir(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    found.push(relative(dir, join(entry.parentPath ?? dir, entry.name)).split(sep).join("/"));
  }
  return found.sort(byCodePoint);
}

/**
 * Writes a build's twins into `out`, one file per twin, and returns them sorted by path. The folder is the tool's, not
 * the site's: a `.md` file a previous run wrote and this one does not is removed, while any other file is left alone.
 */
export async function writeTwins(built: string, out: string): Promise<Twin[]> {
  const twins = await twinFiles(built);
  const written = new Set(twins.map((twin) => twin.path));
  for (const twin of twins) {
    const file = join(out, twin.path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, twin.contents);
  }
  for (const path of await markdownUnder(out)) {
    if (!written.has(path)) await rm(join(out, path), { force: true });
  }
  return twins;
}

/** What a run was asked to do: the fixture to build and, when given, the folder to write the twins to. */
export interface Options {
  readonly fixture: FixtureName;
  readonly out: string;
}

/** Reads `--site <name>` and `--out <dir>`; returns the message for a bad command line instead. */
export function parseArgs(args: readonly string[], repo: string): Options | string {
  let fixture: FixtureName = DEFAULT_FIXTURE;
  let out: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
    if (arg === "--site" || arg === "--out") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) return `${arg} needs a value`;
      index += 1;
      if (arg === "--site") {
        if (!(FIXTURES as readonly string[]).includes(value)) return `unknown fixture "${value}"; expected ${FIXTURES.join(" or ")}`;
        fixture = value as FixtureName;
      } else out = value;
      continue;
    }
    return `unknown argument "${arg}"`;
  }
  return { fixture, out: resolve(out ?? defaultOut(repo, fixture)) };
}

/** Builds the fixture through the engine, writes its twins, and prints where they went. */
export async function main(args: readonly string[] = process.argv.slice(2), repo: string = root): Promise<number> {
  const options = parseArgs(args, repo);
  if (typeof options === "string") {
    console.error(`twins: ${options}\n\ntools/twins/run.ts [--site ${FIXTURES.join("|")}] [--out <dir>]`);
    return 2;
  }
  const built = await builtSite(options.fixture, { root: repo });
  const twins = await writeTwins(built, options.out);
  const where = relative(repo, options.out) || ".";
  console.log(`twins: wrote ${twins.length} Markdown twins of fixtures/${options.fixture} to ${where}`);
  return 0;
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await main();
}
