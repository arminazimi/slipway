// Lighthouse gate: four pages score at least 95 in every category on mobile settings (#1149).
//
//   node tools/lighthouse/run.ts    build fixtures/docs-site and audit it
//   npm run check                   runs this with every other gate
//
// Lighthouse's default preset is its mobile preset: a phone form factor, a 412×823 screen with a 1.75 device
// scale factor, and simulated slow 4G plus a 4× CPU slowdown. Every page is audited once, in every category the
// roadmap names (performance, accessibility, best practices, and SEO), and a score below 95 fails the gate.
//
// The four pages stand in for the fixture's page shapes: the hand-written guides (`/install/` and `/security/`),
// the app page written by the product's own tooling (`/dashboard/`), and a generated rule page
// (`/rules/artifacts-001/`). A page without the content an audit needs (such as no `description` in front matter,
// which the fixture's hand-written home, quickstart, and reference index deliberately leave out) cannot reach the
// SEO budget; fixtures are read-only, so the gate audits pages that exercise each shape with their real metadata.
//
// The browser is optional, as in every gate that needs one: when Lighthouse, chrome-launcher, or a Chromium
// executable is missing the gate prints SKIP and exits 0. The browser job in CI installs them (`quality.ci`); a
// local run uses `$CHROME`, the system Chrome, the browser Playwright installed, or `npx playwright install chromium`.
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { default as lighthouse } from "lighthouse";
import type { LaunchedChrome } from "chrome-launcher";
import { builtSite } from "../fixture-build/build.ts";

/** The repository root: this file sits three levels below it. */
export const root = join(fileURLToPath(import.meta.url), "../../..");

/** The fixture the gate audits. */
export const FIXTURE = "docs-site" as const;

/** The lowest score a page may get in any category, as a percentage. */
export const THRESHOLD = 95;

/** The categories the roadmap budgets, in the order the report names them. */
export const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"] as const;

/** One category the gate scores. */
export type Category = (typeof CATEGORIES)[number];

/** One page to audit and the page shape it stands for. */
export interface PageTarget {
  /** The build-relative URL, such as `/install/`. */
  readonly url: string;
  /** What the page covers, such as `guide` or `rule`. */
  readonly name: string;
}

/**
 * The pages the gate audits. They are the fixture's hand-written guides, its app page, and a generated rule
 * page, so one page from each shape proves the theme keeps its Lighthouse budgets.
 */
export const PAGES: readonly PageTarget[] = [
  { url: "/install/", name: "guide" },
  { url: "/security/", name: "guide" },
  { url: "/dashboard/", name: "app page" },
  { url: "/rules/artifacts-001/", name: "rule" },
];

/** One audit that did not score 1, with the title Lighthouse shows in its report. */
export interface AuditResult {
  /** The audit id, such as `meta-description`. */
  readonly id: string;
  /** One sentence on the audit. */
  readonly title: string;
  /** The audit's score from 0 to 1; a failed audit is below 1. */
  readonly score: number | null;
  /** The value Lighthouse prints, such as `1.2 s`, when it has one. */
  readonly displayValue?: string;
}

/** One category's score for one page. */
export interface CategoryResult {
  /** The category id, one of {@link CATEGORIES}. */
  readonly id: string;
  /** The category title, such as `Performance`. */
  readonly title: string;
  /** The category's score from 0 to 1; `null` when Lighthouse did not score it. */
  readonly score: number | null;
  /** The audits in the category that did not score 1, lowest first. */
  readonly audits: readonly AuditResult[];
}

/** One page's scores. */
export interface PageResult {
  /** What was audited. */
  readonly target: PageTarget;
  /** Every category requested, in the order {@link CATEGORIES} names them. */
  readonly categories: readonly CategoryResult[];
  /** Why the audit did not finish; absent when it did. */
  readonly error?: string;
}

/** One category that missed the budget. */
export interface CategoryFailure {
  /** The page the category scored. */
  readonly target: PageTarget;
  /** The category and its failing audits. */
  readonly category: CategoryResult;
}

/** What an audit run found. */
export interface Report {
  /** Every page, in audit order. */
  readonly pages: readonly PageResult[];
  /** The page/category pairs below the budget. */
  readonly failures: readonly CategoryFailure[];
  /** The pages whose audit did not finish. */
  readonly errors: readonly PageResult[];
}

/** Audits one page. Tests replace it with a fake so they need no browser. */
export type Runner = (target: PageTarget) => Promise<PageResult>;

/** What a real runner needs from Lighthouse and Chromium, so tests can replace it. */
export interface LighthouseRunner {
  /** Audits one page. */
  readonly run: Runner;
  /** Closes Chromium and the server. */
  readonly close: () => Promise<void>;
}

/** How a real audit ends when the browser is not there. */
export interface LighthouseSkip {
  /** Why the gate cannot run. */
  readonly skip: string;
}

/** The score as the percentage the report prints. */
export function percent(score: number): number {
  return Math.round(score * 100);
}

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The build file that holds a URL: `/` is `index.html`, `/guide/` is `guide/index.html`. */
export function fileOf(buildDir: string, url: string): string {
  const path = url.split("?")[0]!.split("#")[0]!;
  const clean = path.replace(/^\/+/, "");
  return clean === "" || clean.endsWith("/") ? join(buildDir, clean, "index.html") : join(buildDir, clean);
}

/** The audits of one category that did not score 1, lowest first, so a failure names what to fix. */
function failedAudits(lhr: NonNullable<Awaited<ReturnType<typeof lighthouse>>>["lhr"], categoryId: string): AuditResult[] {
  const category = lhr.categories[categoryId];
  if (category === undefined) return [];
  return category.auditRefs
    .map((ref) => lhr.audits[ref.id])
    .filter((audit): audit is NonNullable<typeof audit> => audit !== undefined && audit.score !== null && audit.score < 1)
    .map((audit) => ({
      id: audit.id,
      title: audit.title,
      score: audit.score,
      ...(audit.displayValue === undefined ? {} : { displayValue: audit.displayValue }),
    }))
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1) || byCodePoint(a.id, b.id));
}

/** Turns one Lighthouse result into the numbers the gate compares. */
export function summarize(
  target: PageTarget,
  lhr: NonNullable<Awaited<ReturnType<typeof lighthouse>>>["lhr"],
): PageResult {
  const categories: CategoryResult[] = [];
  for (const id of CATEGORIES) {
    const category = lhr.categories[id];
    if (category === undefined) continue;
    categories.push({ id, title: category.title, score: category.score, audits: failedAudits(lhr, id) });
  }
  const runtime = lhr.runtimeError;
  return {
    target,
    categories,
    ...(runtime === undefined ? {} : { error: `${runtime.code}: ${runtime.message}` }),
  };
}

/** Says whether one category met the budget; a missing score is a failure, not a pass. */
export function passes(category: CategoryResult, threshold = THRESHOLD): boolean {
  return category.score !== null && percent(category.score) >= threshold;
}

/** Compares every page against the budget. */
export function evaluate(pages: readonly PageResult[], threshold = THRESHOLD): Report {
  const failures: CategoryFailure[] = [];
  const errors: PageResult[] = [];
  for (const page of pages) {
    if (page.error !== undefined) {
      errors.push(page);
      continue;
    }
    for (const category of page.categories) if (!passes(category, threshold)) failures.push({ target: page.target, category });
  }
  return { pages, failures, errors };
}

/** Audits every target once, then compares the results against the budget. */
export async function audit(targets: readonly PageTarget[], runner: Runner, threshold = THRESHOLD): Promise<Report> {
  const pages: PageResult[] = [];
  for (const target of targets) pages.push(await runner(target));
  return evaluate(pages, threshold);
}

/** One line describing a page: its URL and the shape it covers. */
function describe(target: PageTarget): string {
  return `${target.url} (${target.name})`;
}

/** The failing audits of one page/category pair, so a failure names the audit to fix. */
export function linesFor(failure: CategoryFailure, audits = 5): string[] {
  const { category, target } = failure;
  const score = category.score === null ? "not scored" : String(percent(category.score));
  const lines = [`FAIL ${describe(target)}: ${category.id} ${score} (minimum ${THRESHOLD})`];
  for (const audit of category.audits.slice(0, audits)) {
    const value = audit.score === null ? "not scored" : String(percent(audit.score));
    const display = audit.displayValue === undefined ? "" : ` — ${audit.displayValue}`;
    lines.push(`  ${audit.id} (${value}): ${audit.title}${display}`);
  }
  if (category.audits.length > audits) lines.push(`  … and ${category.audits.length - audits} more`);
  return lines;
}

/** MIME types a built site serves. */
const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

/** Serves one build folder to the browser, so root-relative asset URLs work as they do on a static host. */
async function serve(buildDir: string): Promise<{ server: Server; origin: string }> {
  const root = resolve(buildDir);
  const handler = (request: IncomingMessage, response: ServerResponse): void => {
    let path: string;
    try {
      path = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    } catch {
      response.statusCode = 400;
      response.end("bad request");
      return;
    }

    let file = resolve(root, `.${path}`);
    if (file !== root && !file.startsWith(`${root}${sep}`)) {
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
      try {
        response.setHeader("content-type", CONTENT_TYPES[".html"]!);
        response.end(readFileSync(join(root, "404.html")));
      } catch {
        response.end("not found");
      }
    }
  };

  const server = createServer(handler);
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as AddressInfo;
  return { server, origin: `http://127.0.0.1:${port}` };
}

/** The Chromium to audit with: the one the environment names, else the system browser, else Playwright's. */
async function chromiumPath(): Promise<string | undefined> {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    process.env.CHROME,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  const found = candidates.find((candidate): candidate is string => typeof candidate === "string" && existsSync(candidate));
  if (found !== undefined) return found;

  try {
    const { chromium } = await import("playwright-core");
    const bundled = chromium.executablePath();
    if (existsSync(bundled)) return bundled;
  } catch {
    // Playwright is not installed, or has no browser.
  }
  return undefined;
}

/**
 * Opens Chromium and a local server for `buildDir`, and returns a runner that audits each page once on mobile
 * settings. Returns `{ skip }` when Lighthouse, chrome-launcher, or a Chromium executable is missing: the gate is
 * then optional, not broken.
 */
export async function lighthouseRunner(buildDir: string): Promise<LighthouseRunner | LighthouseSkip> {
  let lighthouse: typeof import("lighthouse").default;
  let launch: typeof import("chrome-launcher").launch;
  try {
    ({ default: lighthouse } = await import("lighthouse"));
    ({ launch } = await import("chrome-launcher"));
  } catch {
    return { skip: "lighthouse or chrome-launcher is not installed (run npm ci)." };
  }

  const executablePath = await chromiumPath();
  if (executablePath === undefined) {
    return { skip: "no Chromium found; set CHROME or run `npx playwright install chromium`." };
  }

  const { server, origin } = await serve(buildDir);
  let chrome: LaunchedChrome;
  try {
    chrome = await launch({
      chromePath: executablePath,
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
      logLevel: "error",
    });
  } catch (err) {
    await new Promise<void>((done) => server.close(() => done()));
    throw err;
  }

  const run: Runner = async (target) => {
    try {
      // `formFactor: "mobile"` makes the mobile settings explicit; the rest of the preset (screen emulation and
      // simulated throttling) comes from Lighthouse's default config.
      const result = await lighthouse(`${origin}${target.url}`, {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: [...CATEGORIES],
        formFactor: "mobile",
      });
      if (result === undefined) return { target, categories: [], error: "lighthouse returned no result" };
      return summarize(target, result.lhr);
    } catch (err) {
      return { target, categories: [], error: err instanceof Error ? err.message : String(err) };
    }
  };

  return {
    run,
    close: async () => {
      try {
        chrome.kill();
      } catch {
        // Chromium already exited.
      }
      await new Promise<void>((done) => server.close(() => done()));
    },
  };
}

/** Prints a report and says whether the gate passed. */
export function report(result: Report): boolean {
  for (const page of result.errors) console.error(`FAIL ${describe(page.target)}: ${page.error}`);
  for (const failure of result.failures) for (const line of linesFor(failure)) console.error(line);
  if (result.errors.length > 0 || result.failures.length > 0) return false;

  const categories = result.pages[0]?.categories.length ?? CATEGORIES.length;
  console.log(`OK: lighthouse (${result.pages.length} pages × ${categories} categories, minimum ${THRESHOLD})`);
  return true;
}

/** Builds the fixture, audits the pages, and compares them against the budget; the gate's entry point. */
export async function main(): Promise<number> {
  let buildDir: string;
  try {
    buildDir = await builtSite(FIXTURE);
  } catch (err) {
    console.error(`FAIL: lighthouse: the ${FIXTURE} fixture did not build: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }

  for (const page of PAGES) {
    if (existsSync(fileOf(buildDir, page.url))) continue;
    console.error(`FAIL: lighthouse: the ${FIXTURE} build has no page at ${page.url} (${page.name}).`);
    return 1;
  }

  let real: LighthouseRunner | LighthouseSkip;
  try {
    real = await lighthouseRunner(buildDir);
  } catch (err) {
    console.error(`FAIL: lighthouse: could not start the browser: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
  if ("skip" in real) {
    console.log(`SKIP: lighthouse: ${real.skip}`);
    return 0;
  }

  try {
    return report(await audit(PAGES, real.run)) ? 0 : 1;
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
