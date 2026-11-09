// Accessibility gate: axe finds no violations in any layout or component page, in light and dark (#1150).
//
//   node tools/axe/run.ts             build fixtures/docs-site and audit it
//   npm run check                     runs this with every other gate
//
// One page per layout and one page per component: the gate reads the theme's `layouts/` and `components/` folders, picks
// the first built page that uses each unit, and audits every distinct page once in both themes. The audit is scoped to
// `<main>`: a layout's job is the page it renders, and the document shell around it (header, sidebar, table of contents)
// belongs to the chrome. Axe's default rule set runs, so the gate fails on any WCAG or best-practice violation.
//
// The browser is optional, as in every gate that needs one: when Playwright or Chromium is not installed the gate prints
// SKIP and exits 0. The browser job in CI installs them (`quality.ci`); a local run uses `$CHROME`, the system Chrome, or
// the browser Playwright installed.
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Page } from "../../packages/engine/src/contracts/index.ts";
import { buildModel } from "../../packages/engine/src/model/build.ts";
import { builtSite } from "../fixture-build/build.ts";

/** The repository root: this file sits three levels below it. */
export const root = join(fileURLToPath(import.meta.url), "../../..");

/** The fixture the gate audits. */
export const FIXTURE = "docs-site" as const;

/** The layout the engine uses for a page that names none (`builtSite` passes the same default). */
export const DEFAULT_LAYOUT = "doc";

/** The themes every page is audited in. */
export const THEMES = ["light", "dark"] as const;

/** One theme the gate audits. */
export type Theme = (typeof THEMES)[number];

/** A page to audit, and the layouts and components it stands for. */
export interface Target {
  /** The build-relative URL, such as `/features/`. */
  readonly url: string;
  /** What the page covers, such as `layout doc` or `component callout`, sorted. */
  readonly names: readonly string[];
}

/** What page selection found: the pages to audit and the units the fixture has no page for. */
export interface Discovery {
  /** Distinct pages, sorted by URL, each with every unit it covers. */
  readonly targets: readonly Target[];
  /** Units without a page in the fixture, such as `layout home`, sorted. */
  readonly gaps: readonly string[];
}

/** One node axe blamed for a violation. */
export interface ViolationNode {
  /** CSS selectors that point at the element. */
  readonly target: readonly string[];
  /** The element's HTML, as axe returns it. */
  readonly html?: string;
  /** What is wrong and how to fix it. */
  readonly failureSummary?: string;
}

/** One axe rule the page broke. */
export interface Violation {
  /** The rule id, such as `image-alt`. */
  readonly id: string;
  /** How much the violation affects people: `critical`, `serious`, `moderate`, or `minor`. */
  readonly impact?: string | null;
  /** One sentence on the rule. */
  readonly help?: string;
  /** The rule's documentation. */
  readonly helpUrl?: string;
  /** The elements that broke the rule. */
  readonly nodes: readonly ViolationNode[];
}

/** Audits one URL in one theme. Tests replace it with a fake so they need no browser. */
export type Auditor = (url: string, theme: Theme) => Promise<readonly Violation[]>;

/** One page's result in one theme. */
export interface PageReport {
  /** What was audited. */
  readonly target: Target;
  /** The theme it was audited in. */
  readonly theme: Theme;
  /** The violations axe found; empty when the page passes. */
  readonly violations: readonly Violation[];
}

/** What an audit run found. */
export interface Report {
  /** Every page and theme, in audit order. */
  readonly pages: readonly PageReport[];
  /** The page/theme pairs with at least one violation. */
  readonly failures: readonly PageReport[];
}

/**
 * How axe recognises a rendered component in the build. Each component is named after its folder; the marker is the
 * class or element its `index.ts` writes. A new component without a marker stops the gate: silently skipping it would
 * make the gate lie about what it covers.
 */
export const COMPONENT_MARKERS: Readonly<Record<string, string>> = {
  badge: 'class="badge',
  callout: 'class="callout',
  cards: 'class="cards"',
  code: "<pre",
  "code-tabs": "code-tabs",
  details: "<details",
  embed: 'class="embed',
  endpoint: 'class="endpoint',
  figure: "<figure",
  "file-tree": 'class="file-tree',
  "heading-anchor": 'class="heading-anchor',
  kbd: "<kbd",
  mermaid: 'class="mermaid',
  "page-status": 'class="page-status',
  "schema-table": 'class="schema-table',
  steps: 'class="steps"',
  table: "<table",
  tags: 'class="tags"',
  terminal: 'class="terminal',
};

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The layout names in a theme's `layouts/` folder; `base` is the shell the other layouts use, not a page layout. */
export function layoutNames(layoutsDir: string): string[] {
  if (!existsSync(layoutsDir)) return [];
  return readdirSync(layoutsDir)
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
    .map((file) => file.slice(0, -".ts".length))
    .filter((name) => name !== "base")
    .sort(byCodePoint);
}

/** The component names in a theme's `components/` folder, one folder per component. */
export function componentNames(componentsDir: string): string[] {
  if (!existsSync(componentsDir)) return [];
  return readdirSync(componentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(byCodePoint);
}

/** The build file that holds a URL: `/` is `index.html`, `/guide/` is `guide/index.html`. */
export function fileOf(buildDir: string, url: string): string {
  const path = url.split("?")[0]!.split("#")[0]!;
  const clean = path.replace(/^\/+/, "");
  return clean === "" || clean.endsWith("/") ? join(buildDir, clean, "index.html") : join(buildDir, clean);
}

/** The HTML of each page in the build, read once; an absent page reads as empty. */
function htmlOfPages(buildDir: string, pages: readonly Page[]): Map<string, string> {
  const html = new Map<string, string>();
  for (const page of pages) {
    const file = fileOf(buildDir, page.url);
    try {
      html.set(page.url, statSync(file).isFile() ? readFileSync(file, "utf8") : "");
    } catch {
      html.set(page.url, "");
    }
  }
  return html;
}

/** The layout a built page used: its front matter, else the engine's default for a page that names none. */
export function layoutOf(page: Page): string {
  const layout = page.frontMatter.layout;
  return typeof layout === "string" && layout !== "" ? layout : DEFAULT_LAYOUT;
}

/** Adds a unit to a URL's entry, keeping one target per page. */
function cover(map: Map<string, Set<string>>, url: string, name: string): void {
  const names = map.get(url);
  if (names === undefined) map.set(url, new Set([name]));
  else names.add(name);
}

/**
 * Picks the pages to audit: the first built page for each layout, and the first page whose HTML renders each component.
 * Units the fixture has no page for are returned as gaps instead of being skipped silently.
 */
export function discover(buildDir: string, pages: readonly Page[], layoutsDir: string, componentsDir: string): Discovery {
  const covered = new Map<string, Set<string>>();
  const gaps: string[] = [];
  const sorted = [...pages].sort((a, b) => byCodePoint(a.url, b.url));
  const html = htmlOfPages(buildDir, sorted);

  const byLayout = new Map<string, string>();
  for (const page of sorted) {
    const layout = layoutOf(page);
    if (!byLayout.has(layout)) byLayout.set(layout, page.url);
  }
  for (const layout of layoutNames(layoutsDir)) {
    const url = byLayout.get(layout);
    if (url === undefined) gaps.push(`layout ${layout}`);
    else cover(covered, url, `layout ${layout}`);
  }

  for (const component of componentNames(componentsDir)) {
    const marker = COMPONENT_MARKERS[component];
    if (marker === undefined) {
      throw new Error(`axe: no marker for component "${component}"; add one to COMPONENT_MARKERS in tools/axe/run.ts.`);
    }
    const page = sorted.find((candidate) => (html.get(candidate.url) ?? "").includes(marker));
    if (page === undefined) gaps.push(`component ${component}`);
    else cover(covered, page.url, `component ${component}`);
  }

  const targets = [...covered.entries()]
    .map(([url, names]) => ({ url, names: [...names].sort(byCodePoint) }))
    .sort((a, b) => byCodePoint(a.url, b.url));
  return { targets, gaps: gaps.sort(byCodePoint) };
}

/** Audits every target in every theme, one page at a time. */
export async function audit(targets: readonly Target[], themes: readonly Theme[], auditor: Auditor): Promise<Report> {
  const pages: PageReport[] = [];
  for (const theme of themes) {
    for (const target of targets) {
      const violations = await auditor(target.url, theme);
      pages.push({ target, theme, violations });
    }
  }
  return { pages, failures: pages.filter((page) => page.violations.length > 0) };
}

/** One line describing a page: its URL and what it covers. */
function describe(target: Target): string {
  return `${target.url} (${target.names.join(", ")})`;
}

/** The violations of one page/theme pair, with the first few nodes, so a failure names the element to fix. */
export function linesFor(page: PageReport, nodes = 3): string[] {
  const lines = [`FAIL ${page.theme} ${describe(page.target)}: ${page.violations.length} violation(s)`];
  for (const violation of page.violations) {
    const impact = violation.impact ? ` (${violation.impact})` : "";
    lines.push(`  ${violation.id}${impact}: ${violation.help ?? ""}`.trimEnd());
    for (const node of violation.nodes.slice(0, nodes)) lines.push(`    ${node.target.join(" ")}`);
  }
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

/** What a real auditor needs from a browser, so tests can replace it. */
export interface PlaywrightAuditor {
  /** Audits one page in one theme. */
  readonly auditor: Auditor;
  /** Closes the browser and the server. */
  readonly close: () => Promise<void>;
}

/** How a real audit ends when the browser is not there. */
export interface PlaywrightSkip {
  /** Why the gate cannot run. */
  readonly skip: string;
}

/** Axe's default rule set; the page content is the audit's scope, so the chrome's own landmarks are not re-checked. */
const AUDIT_SCOPE = "main";

/**
 * Opens Chromium and a local server for `buildDir`, and returns an auditor that loads each page in both themes.
 * Returns `{ skip }` when Playwright, axe, or a Chromium executable is missing: the gate is then optional, not broken.
 */
export async function playwrightAuditor(buildDir: string): Promise<PlaywrightAuditor | PlaywrightSkip> {
  let chromium: typeof import("playwright-core").chromium;
  let AxeBuilder: typeof import("@axe-core/playwright").default;
  try {
    ({ chromium } = await import("playwright-core"));
    ({ default: AxeBuilder } = await import("@axe-core/playwright"));
  } catch {
    return { skip: "@axe-core/playwright or playwright-core is not installed (run npm ci)." };
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
  let browser: Awaited<ReturnType<typeof chromium.launch>>;
  try {
    browser = await chromium.launch({ executablePath, headless: true });
  } catch (err) {
    await new Promise<void>((done) => server.close(() => done()));
    throw err;
  }

  const contexts = new Map<Theme, Awaited<ReturnType<typeof browser.newContext>>>();
  const auditor: Auditor = async (url, theme) => {
    let context = contexts.get(theme);
    if (context === undefined) {
      context = await browser.newContext({ colorScheme: theme });
      contexts.set(theme, context);
    }
    const page = await context.newPage();
    try {
      await page.goto(`${origin}${url}`, { waitUntil: "load" });
      // A first visit is dark by default; force the theme the audit is for, and make media queries agree.
      await page.emulateMedia({ colorScheme: theme });
      await page.evaluate((name) => document.documentElement.setAttribute("data-theme", name), theme);
      await page.evaluate(() => document.fonts.ready);
      const results = await new AxeBuilder({ page }).include(AUDIT_SCOPE).analyze();
      return results.violations as readonly Violation[];
    } finally {
      await page.close();
    }
  };

  return {
    auditor,
    close: async () => {
      for (const context of contexts.values()) await context.close();
      await browser.close();
      await new Promise<void>((done) => server.close(() => done()));
    },
  };
}

/** Prints a report and says whether the gate passed. */
export function report(result: Report, gaps: readonly string[] = []): boolean {
  if (gaps.length > 0) console.log(`note: fixtures/${FIXTURE} has no page for ${gaps.join(", ")}.`);
  for (const page of result.failures) for (const line of linesFor(page)) console.error(line);
  if (result.failures.length > 0) return false;

  const pages = new Set(result.pages.map((page) => page.target.url));
  console.log(
    `OK: axe (${result.pages.length} audits: ${pages.size} pages, ${THEMES.length} themes, ${gaps.length} unit(s) without a page)`,
  );
  return true;
}

/** Builds the fixture, selects the pages, and audits them; the gate's entry point. */
export async function main(): Promise<number> {
  let buildDir: string;
  try {
    buildDir = await builtSite(FIXTURE);
  } catch (err) {
    console.error(`FAIL: axe: the ${FIXTURE} fixture did not build: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }

  let discovery: Discovery;
  try {
    const model = await buildModel(join(root, "fixtures", FIXTURE));
    discovery = discover(buildDir, model.site.pages, join(root, "packages/theme/layouts"), join(root, "packages/theme/components"));
  } catch (err) {
    console.error(`FAIL: axe: could not select the pages to audit: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }

  let real: PlaywrightAuditor | PlaywrightSkip;
  try {
    real = await playwrightAuditor(buildDir);
  } catch (err) {
    console.error(`FAIL: axe: could not start the browser: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
  if ("skip" in real) {
    console.log(`SKIP: axe: ${real.skip}`);
    return 0;
  }

  try {
    const result = await audit(discovery.targets, THEMES, real.auditor);
    return report(result, discovery.gaps) ? 0 : 1;
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
