// App-page gate (issue #1189): the dashboard of examples/product-docs is copied byte-for-byte and appears in no
// generated agent or search output.
//
//   node tools/app-page-check/run.ts    build examples/product-docs and check its dashboard
//
// `examples/product-docs/dashboard/` is a static app page: its own HTML, CSS, JavaScript, and data. The engine copies
// the folder untouched (output.app-pages) and every output skips it. This gate builds the example in a temp folder,
// hashes every file in the source and output dashboard folders, then reads the generated outputs back: the Pagefind
// fragments (decompressed), the two llms files, the Markdown twin path, and sourcemap.json. A missing, extra, or
// changed dashboard file fails, and so does a dashboard URL in any of them. The build folder is removed whatever the
// result.
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { build } from "../../packages/engine/src/pipeline/build.ts";

/** The repository root: this file sits three levels below it. */
export const root = join(fileURLToPath(import.meta.url), "../../..");

/** The example the gate builds: the Evergreen-shaped site that carries the dashboard. */
export const SITE = "examples/product-docs";

/** The app page's folder, relative to the site root and to the output folder. */
export const APP = "dashboard";

/** Layout for a page that names none; the engine CLI's default (`mizzen build`). */
const DEFAULT_LAYOUT = "doc";

/** Every file under `dir`, relative to it with `/` separators and sorted by code point (ADR 0022, rule 5). */
export async function filesUnder(dir: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    found.push(relative(dir, join(entry.parentPath ?? dir, entry.name)).split(sep).join("/"));
  }
  return found.sort(byCodePoint);
}

/** SHA-256 of every file under `dir`, keyed by its relative path with `/` separators. */
export async function digestTree(dir: string): Promise<ReadonlyMap<string, string>> {
  const digests = new Map<string, string>();
  for (const path of await filesUnder(dir)) {
    const hash = createHash("sha256").update(await readFile(join(dir, path))).digest("hex");
    digests.set(path, hash);
  }
  return digests;
}

/** How two folders disagree about one file. */
export type DifferenceKind = "missing" | "extra" | "changed";

/** One file that differs between the source and output folders. `path` is relative to the app folder. */
export interface Difference {
  readonly path: string;
  readonly kind: DifferenceKind;
}

/** Every file that differs between two digested folders, in path order. */
export function compareTrees(source: ReadonlyMap<string, string>, output: ReadonlyMap<string, string>): Difference[] {
  const differences: Difference[] = [];
  for (const path of [...new Set([...source.keys(), ...output.keys()])].sort(byCodePoint)) {
    const [left, right] = [source.get(path), output.get(path)];
    if (left === undefined) differences.push({ path, kind: "extra" });
    else if (right === undefined) differences.push({ path, kind: "missing" });
    else if (left !== right) differences.push({ path, kind: "changed" });
  }
  return differences;
}

/** The output a finding came from, so the report names the check that failed. */
export type Check = "copy" | "search" | "llms" | "twins" | "sourcemap";

/** One thing that breaks the gate's promise about the app page. */
export interface Finding {
  readonly check: Check;
  readonly message: string;
}

/** What inspecting one build found: how many source files were compared, and every finding. */
export interface Report {
  /** Number of files in the source app folder. */
  readonly appFiles: number;
  readonly findings: readonly Finding[];
}

/** What {@link inspect} reads. */
export interface InspectOptions {
  /** The app page's source folder, such as `examples/product-docs/dashboard`. */
  readonly source: string;
  /** The build output folder. */
  readonly out: string;
  /** The app page's folder inside both, such as `dashboard`. Default: {@link APP}. */
  readonly app?: string;
}

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The folder name with no leading or trailing slash, so `app` and `/app/` mean the same app page. */
function appName(app: string): string {
  return app.replace(/^\/+|\/+$/g, "");
}

/**
 * True when `url` is the app page or a file inside it: the query and hash go, `index.html` goes, and a trailing slash
 * goes, so `/dashboard/`, `/dashboard`, and `/dashboard/index.html` all name the app page.
 */
export function underApp(url: string, app: string): boolean {
  const path = (url.trim().split(/[?#]/, 1)[0] ?? "").replace(/\/index\.html?$/i, "").replace(/\/+$/, "");
  const root = `/${appName(app)}`;
  return path === root || path.startsWith(`${root}/`);
}

/**
 * Every Pagefind fragment whose URL is the app page. Pagefind writes one gzip-compressed JSON record per indexed page
 * under `pagefind/fragment/`, so the URLs are read back rather than searched for as text: a page that links to the
 * dashboard still mentions it, and only a record with the dashboard's own URL proves it was indexed.
 */
export async function searchFindings(out: string, app: string = APP): Promise<Finding[]> {
  const folder = join(out, "pagefind", "fragment");
  if (!existsSync(folder)) return [{ check: "search", message: "no Pagefind fragments to inspect" }];

  const findings: Finding[] = [];
  let fragments = 0;
  for (const name of (await readdir(folder)).sort(byCodePoint)) {
    if (!name.endsWith(".pf_fragment")) continue;
    fragments += 1;
    const text = gunzipSync(await readFile(join(folder, name))).toString("utf8");
    // A fragment is a magic prefix (`pagefind_dcd`) and then one JSON record; the prefix is not part of the record.
    const record = JSON.parse(text.slice(text.indexOf("{"))) as { url?: unknown };
    if (typeof record.url === "string" && underApp(record.url, app)) {
      findings.push({ check: "search", message: `${name} indexes ${record.url}` });
    }
  }
  if (fragments === 0) findings.push({ check: "search", message: "no Pagefind fragments to inspect" });
  return findings;
}

/** A link to the app page in `llms.txt` or `llms-full.txt`; their prose may mention the dashboard, a URL may not. */
export async function llmsFindings(out: string, app: string = APP): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const name of ["llms.txt", "llms-full.txt"]) {
    const file = join(out, name);
    if (!existsSync(file)) {
      findings.push({ check: "llms", message: `no ${name} to inspect` });
      continue;
    }
    const text = await readFile(file, "utf8");
    if (text.includes(`/${appName(app)}/`) || text.includes(`${appName(app)}/index.md`)) {
      findings.push({ check: "llms", message: `${name} links to ${appName(app)}` });
    }
  }
  return findings;
}

/**
 * The Markdown twin a doc page at `/dashboard/` would write: `dashboard/index.md`. A Markdown file inside the app
 * folder that the source also has is a copy, not a twin, so only this generated path counts.
 */
export async function twinFindings(out: string, app: string = APP): Promise<Finding[]> {
  const twin = `${appName(app)}/index.md`;
  return existsSync(join(out, twin)) ? [{ check: "twins", message: `${twin} exists` }] : [];
}

/**
 * A page entry for the app page in `sourcemap.json`. Links to the app page from doc pages are kept, as they are a
 * page's real links; an entry's `url` or `source` is what puts the app page in the map.
 */
export async function sourcemapFindings(out: string, app: string = APP): Promise<Finding[]> {
  const file = join(out, "sourcemap.json");
  if (!existsSync(file)) return [{ check: "sourcemap", message: "no sourcemap.json to inspect" }];

  const map = JSON.parse(await readFile(file, "utf8")) as {
    pages?: readonly { readonly url?: unknown; readonly source?: unknown }[];
  };
  const folder = appName(app);
  const findings: Finding[] = [];
  for (const page of map.pages ?? []) {
    if (typeof page.url === "string" && underApp(page.url, app)) {
      findings.push({ check: "sourcemap", message: `${page.url} is a page entry` });
    } else if (typeof page.source === "string" && (page.source === folder || page.source.startsWith(`${folder}/`))) {
      findings.push({ check: "sourcemap", message: `${page.source} is a source` });
    }
  }
  return findings;
}

/** Compares the source and output app folders, then checks every output that must not name the app page. */
export async function inspect(options: InspectOptions): Promise<Report> {
  const app = appName(options.app ?? APP);
  const source = await digestTree(options.source);
  const outputFolder = join(options.out, app);
  const output = existsSync(outputFolder) ? await digestTree(outputFolder) : new Map<string, string>();

  const findings: Finding[] = compareTrees(source, output).map((difference) => ({
    check: "copy",
    message: `${app}/${difference.path}: ${difference.kind}`,
  }));
  findings.push(...(await searchFindings(options.out, app)));
  findings.push(...(await llmsFindings(options.out, app)));
  findings.push(...(await twinFindings(options.out, app)));
  findings.push(...(await sourcemapFindings(options.out, app)));
  return { appFiles: source.size, findings };
}

/**
 * Builds `examples/product-docs` through the engine in a temp folder and inspects its dashboard. A build error,
 * rather than a finding, throws: the gate must not pass because the site did not build.
 */
export async function checkExample(repo: string = root): Promise<Report> {
  const scratch = await mkdtemp(join(tmpdir(), "app-page-check-"));
  const out = join(scratch, "out");
  try {
    const result = await build({
      root: join(repo, SITE),
      out,
      themeRoot: join(repo, "packages/theme"),
      defaultLayout: DEFAULT_LAYOUT,
    });
    const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === "error");
    if (errors.length > 0) {
      const lines = errors.map((diagnostic) => `  ${diagnostic.id}: ${diagnostic.message}`);
      throw new Error(`app-page-check: ${SITE} has ${errors.length} build error(s):\n${lines.join("\n")}`);
    }
    return await inspect({ source: join(repo, SITE, APP), out, app: APP });
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

/** Builds and inspects the example, prints every finding, and returns the process exit code. */
export async function main(): Promise<number> {
  const report = await checkExample();
  if (report.findings.length > 0) {
    console.error(`app-page-check: ${SITE} failed ${report.findings.length} check(s).`);
    for (const finding of report.findings) console.error(`  ${finding.check}: ${finding.message}`);
    return 1;
  }
  console.log(
    `app-page-check: ok (${report.appFiles} dashboard files byte-identical, absent from search, llms, twins, and source map)`,
  );
  return 0;
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await main();
}
