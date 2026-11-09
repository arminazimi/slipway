// Search-scale gate: on the 600-page docs fixture, the index stays under 1 MB and the first result shows in under
// 300 ms, index load included (#1187).
//
//   node tools/search-scale/run.ts       build fixtures/docs-site and measure search in Chromium
//   npm run check                        runs this with every other gate
//
// The fixture is `fixtures/docs-site` (about 600 pages); the small `rtl-site` says nothing about scale. The gate
// builds it through `tools/fixture-build`, so the folder is reused while the engine, the theme, and the fixture are
// unchanged, and it measures what a visitor waits for: a fresh browser profile opens the built site, loads Pagefind's
// browser module on demand, searches, and reads the first hit. Those are the three calls the search island makes on
// first open, timed from the import so the index load is inside the number. The fixture's pages do not ship the
// theme's client islands yet, so the gate makes the calls itself instead of clicking a button that no script reveals.
//
// What "the index" means is what Pagefind writes: every file under `pagefind/`, fragments and UI assets included. That
// is the same total the engine's own search test budgets, so the two agree about the size of 600 pages. The server is
// local, which is at least as fast as the "fast connection" the issue names; the printed index size is the payload
// that would cross it.
//
// The browser is optional, as in every gate that needs one: when Playwright or Chromium is not installed the gate
// prints SKIP and exits 0. A local run uses `$CHROME`, the system Chrome, or the browser Playwright installed.
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Browser } from "playwright-core";
import { builtSite } from "../fixture-build/build.ts";

/** The repository root: this file sits three levels below it. */
export const root = join(fileURLToPath(import.meta.url), "../../..");

/** The fixture the gate measures; it holds about 600 pages, like a large generated reference. */
export const FIXTURE = "docs-site";

/** Where Pagefind writes the index, relative to the output folder. */
export const PAGEFIND_DIR = "pagefind";

/** The query: a word on every generated rule page, so the first hit ranks among 600 pages rather than a handful. */
export const QUERY = "rule";

/** The index budget, in bytes, before compression. The engine's search test uses the same number. */
export const INDEX_BUDGET_BYTES = 1_000_000;

/** The first-result budget, in milliseconds, index load included. */
export const FIRST_RESULT_BUDGET_MS = 300;

/** The fewest pages the fixture must build for its numbers to say anything about scale. */
export const MIN_PAGES = 500;

/** How many fresh profiles measure the first result; the report uses the median, so one slow start does not decide. */
export const SAMPLES = 3;

/** The size of a folder of files: every file under it, however deep. */
export interface FolderSize {
  /** Total size in bytes. */
  readonly bytes: number;
  /** How many files were counted. */
  readonly files: number;
}

/** One timed visit to a fresh browser profile. */
export interface Sample {
  /** Time from loading the index to the first hit's data, in whole milliseconds. */
  readonly ms: number;
  /** How many results the query returned. */
  readonly results: number;
  /** The first hit's URL, empty when the query found nothing. */
  readonly url: string;
  /** The first hit's title, empty when the query found nothing. */
  readonly title: string;
  /** How many files the page fetched from `pagefind/` before search opened; must be zero. */
  readonly pageLoadIndexRequests: number;
  /** How many files the first query fetched from `pagefind/`; must be more than zero. */
  readonly queryIndexRequests: number;
}

/** What the browser measured: the median first result and the numbers a reader would wait for. */
export interface FirstResult {
  /** Median time to the first hit, in whole milliseconds. */
  readonly ms: number;
  /** Every sample's time, sorted, for the printed line. */
  readonly samples: readonly number[];
  /** How many results the query returned, the fewest over the samples. */
  readonly results: number;
  /** The median sample's first hit URL. */
  readonly url: string;
  /** The median sample's first hit title. */
  readonly title: string;
  /** Files fetched from `pagefind/` before search opened, summed over the samples; must be zero. */
  readonly pageLoadIndexRequests: number;
  /** Files fetched from `pagefind/` by the first query, the fewest over the samples. */
  readonly queryIndexRequests: number;
}

/** Everything the gate measured, plus what the fixture has, so the verdict needs nothing else. */
export interface Measurement extends FirstResult {
  /** HTML pages the build wrote. */
  readonly pages: number;
  /** Bytes Pagefind wrote under `pagefind/`. */
  readonly indexBytes: number;
  /** Files Pagefind wrote under `pagefind/`. */
  readonly indexFiles: number;
}

/** The gate's decision. */
export interface Verdict {
  /** True when every budget holds. */
  readonly ok: boolean;
  /** What went over, in the order the report prints it; empty when `ok`. */
  readonly problems: readonly string[];
}

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byNumber(a: number, b: number): number {
  return a - b;
}

/** Groups thousands with commas, so byte counts read at a glance and never depend on the machine's locale. */
export function formatNumber(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** A folder's size: every file under it, summed, sorted by nothing because only the totals are kept. */
export function indexSize(dir: string): FolderSize {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return { bytes: 0, files: 0 };
  const sizes: number[] = [];
  const walk = (path: string): void => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile()) sizes.push(statSync(child).size);
    }
  };
  walk(dir);
  return { bytes: sizes.reduce((total, size) => total + size, 0), files: sizes.length };
}

/** How many HTML pages a built site has, however deep its folders go. */
export function pageCount(dir: string): number {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return 0;
  let count = 0;
  const walk = (path: string): void => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile() && entry.name.endsWith(".html")) count += 1;
    }
  };
  walk(dir);
  return count;
}

/**
 * Decides whether the measurement passes. Every rule is a budget the issue names, plus two guards: the fixture must
 * still be big enough for the numbers to mean something, and both the page load and the first query must show the
 * index moving at the right moment — never on load, always on the first search.
 */
export function verdict(measurement: Measurement): Verdict {
  const problems: string[] = [];
  if (measurement.pages < MIN_PAGES) {
    problems.push(`the build has ${measurement.pages} pages; the gate measures at least ${MIN_PAGES}`);
  }
  if (measurement.indexBytes === 0) {
    problems.push(`the build wrote no search index under ${PAGEFIND_DIR}/`);
  } else if (measurement.indexBytes >= INDEX_BUDGET_BYTES) {
    problems.push(`the index is ${formatNumber(measurement.indexBytes)} bytes, over the ${formatNumber(INDEX_BUDGET_BYTES)} byte budget`);
  }
  if (measurement.pageLoadIndexRequests > 0) {
    problems.push(`the page load fetched ${measurement.pageLoadIndexRequests} file(s) from ${PAGEFIND_DIR}/; the index must load only when search opens`);
  }
  if (measurement.results === 0) {
    problems.push(`the query "${QUERY}" returned no results`);
  } else if (measurement.queryIndexRequests === 0) {
    problems.push(`the first query fetched nothing from ${PAGEFIND_DIR}/`);
  }
  if (measurement.ms >= FIRST_RESULT_BUDGET_MS) {
    problems.push(`the first result took ${measurement.ms} ms, over the ${FIRST_RESULT_BUDGET_MS} ms budget`);
  }
  return { ok: problems.length === 0, problems };
}

/** The report as lines: the fixture, the two budgets, the hit, and the verdict. */
export function formatReport(measurement: Measurement, decision: Verdict): string[] {
  const samples = measurement.samples.map((ms) => `${ms} ms`).join(", ");
  const lines = [
    `search-scale: ${FIXTURE}: ${measurement.pages} pages`,
    `  index         ${formatNumber(measurement.indexBytes)} bytes in ${measurement.indexFiles} files (budget ${formatNumber(INDEX_BUDGET_BYTES)})`,
    `  first result  ${measurement.ms} ms, median of ${measurement.samples.length} (${samples}); budget ${FIRST_RESULT_BUDGET_MS} ms`,
    `    ${measurement.url || "(no hit)"} — ${measurement.title || "(no title)"}, ${measurement.results} results`,
    `  index load    ${measurement.pageLoadIndexRequests} files before search, ${measurement.queryIndexRequests} on the first query`,
    ...decision.problems.map((problem) => `  ${problem}`),
    `search-scale: ${decision.ok ? "OK" : "FAIL"}`,
  ];
  return lines;
}

/** MIME types the gate's server needs: the page, Pagefind's module and worker, and Pagefind's own extensions. */
const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pagefind": "application/wasm",
  ".wasm": "application/wasm",
};

/** Serves one build folder to the browser, so root-relative URLs and the Pagefind module work as on a static host. */
async function serve(buildDir: string): Promise<{ server: Server; origin: string }> {
  const base = resolve(buildDir);
  const handler = (request: IncomingMessage, response: ServerResponse): void => {
    let path: string;
    try {
      path = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    } catch {
      response.statusCode = 400;
      response.end("bad request");
      return;
    }

    let file = resolve(base, `.${path}`);
    if (file !== base && !file.startsWith(`${base}${sep}`)) {
      response.statusCode = 403;
      response.end("forbidden");
      return;
    }
    if (path.endsWith("/")) file = join(file, "index.html");

    try {
      if (!statSync(file).isFile()) throw new Error("not a file");
      response.setHeader("content-type", CONTENT_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream");
      response.end(readFileSync(file));
    } catch {
      response.statusCode = 404;
      response.end("not found");
    }
  };

  const server = createServer(handler);
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as AddressInfo;
  return { server, origin: `http://127.0.0.1:${port}` };
}

/** Closes a server the gate opened. */
async function stop(server: Server): Promise<void> {
  await new Promise<void>((done) => server.close(() => done()));
}

/** The first Chromium that exists: the one the environment names, else the system browser. */
export function chromiumPath(): string | undefined {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    process.env.CHROME,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  return candidates.find((candidate): candidate is string => typeof candidate === "string" && existsSync(candidate));
}

/** A browser the gate can measure in. */
export interface PlaywrightGate {
  /** Measures the first result in a fresh profile, one sample per {@link SAMPLES}. */
  readonly measure: () => Promise<FirstResult>;
  /** Closes the browser and the server. */
  readonly close: () => Promise<void>;
}

/** How a real measurement ends when the browser is not there. */
export interface PlaywrightSkip {
  /** Why the gate cannot run. */
  readonly skip: string;
}

/** What the page returns from its own timing, so the Node side only reduces numbers. */
interface BrowserSample {
  readonly ms: number;
  readonly results: number;
  readonly url: string;
  readonly title: string;
}

/** The part of Pagefind's browser module the gate calls, the same calls the search island makes. */
interface PagefindBrowserApi {
  search(term: string): Promise<{ readonly results: readonly PagefindHit[] }>;
}

/** One hit in Pagefind's result list. */
interface PagefindHit {
  data(): Promise<{ readonly url?: string; readonly meta?: { readonly title?: string } }>;
}

/**
 * Opens Chromium and a local server for `buildDir`. The browser is optional: when Playwright or a Chromium is
 * missing the gate returns `{ skip }`, so it is skipped rather than broken, like every browser gate here.
 */
export async function playwrightGate(buildDir: string): Promise<PlaywrightGate | PlaywrightSkip> {
  let chromium: typeof import("playwright-core").chromium;
  try {
    ({ chromium } = await import("playwright-core"));
  } catch {
    return { skip: "playwright-core is not installed (run npm ci)." };
  }

  let executablePath = chromiumPath();
  if (executablePath === undefined) {
    try {
      const bundled = chromium.executablePath();
      if (existsSync(bundled)) executablePath = bundled;
    } catch {
      // No browser installed by Playwright either.
    }
  }
  if (executablePath === undefined) {
    return { skip: "no Chromium found; set CHROME or run `npx playwright install chromium`." };
  }

  const { server, origin } = await serve(buildDir);
  let browser: Browser;
  try {
    browser = await chromium.launch({ executablePath, headless: true });
  } catch (err) {
    await stop(server);
    throw err;
  }

  /** One cold visit: a fresh profile, the page, then the index and the first hit. */
  const sample = async (): Promise<Sample> => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().startsWith(`${origin}/${PAGEFIND_DIR}/`)) requests.push(request.url());
    });
    try {
      await page.goto(`${origin}/`, { waitUntil: "load" });
      const pageLoadIndexRequests = requests.length;
      requests.length = 0;

      const run = await page.evaluate(
        async ({ moduleUrl, query }): Promise<BrowserSample> => {
          const began = performance.now();
          const pagefind = (await import(moduleUrl)) as PagefindBrowserApi;
          const found = await pagefind.search(query);
          const first = found.results[0];
          const data = first === undefined ? undefined : await first.data();
          return {
            ms: Math.round(performance.now() - began),
            results: found.results.length,
            url: data?.url ?? "",
            title: data?.meta?.title ?? "",
          };
        },
        { moduleUrl: `${origin}/${PAGEFIND_DIR}/pagefind.js`, query: QUERY },
      );

      return { ...run, pageLoadIndexRequests, queryIndexRequests: requests.length };
    } finally {
      await context.close();
    }
  };

  const measure = async (): Promise<FirstResult> => {
    const samples: Sample[] = [];
    for (let i = 0; i < SAMPLES; i += 1) samples.push(await sample());

    const times = samples.map((entry) => entry.ms).sort(byNumber);
    const median = times[Math.floor(times.length / 2)] ?? 0;
    const typical = samples.find((entry) => entry.ms === median) ?? samples[0]!;
    return {
      ms: median,
      samples: times,
      results: Math.min(...samples.map((entry) => entry.results)),
      url: typical.url,
      title: typical.title,
      pageLoadIndexRequests: samples.reduce((total, entry) => total + entry.pageLoadIndexRequests, 0),
      queryIndexRequests: Math.min(...samples.map((entry) => entry.queryIndexRequests)),
    };
  };

  return {
    measure,
    close: async () => {
      await browser.close();
      await stop(server);
    },
  };
}

/** The gate's entry point: build, measure, print, and say whether it passed. */
export async function main(): Promise<number> {
  let buildDir: string;
  try {
    buildDir = await builtSite(FIXTURE);
  } catch (err) {
    console.error(`FAIL: search-scale: the ${FIXTURE} fixture did not build: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }

  const index = indexSize(join(buildDir, PAGEFIND_DIR));
  const pages = pageCount(buildDir);

  let real: PlaywrightGate | PlaywrightSkip;
  try {
    real = await playwrightGate(buildDir);
  } catch (err) {
    console.error(`FAIL: search-scale: could not start the browser: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
  if ("skip" in real) {
    console.log(`SKIP: search-scale: ${real.skip}`);
    return 0;
  }

  try {
    const first = await real.measure();
    const measurement: Measurement = { ...first, pages, indexBytes: index.bytes, indexFiles: index.files };
    const decision = verdict(measurement);
    for (const line of formatReport(measurement, decision)) console.log(line);
    return decision.ok ? 0 : 1;
  } catch (err) {
    console.error(`FAIL: search-scale: the measurement did not finish: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  } finally {
    await real.close();
  }
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
