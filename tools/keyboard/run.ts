// Keyboard gate (issue #1151): every flow a keyboard user needs works, in the order they meet it.
//
//   node tools/keyboard/run.ts                build fixtures/docs-site and test it
//   node tools/keyboard/run.ts --site <dir>   test an already built site instead
//   npm run check                             runs this with every other gate
//
// The gate opens the engine's build of `fixtures/docs-site` in Chromium and walks the keyboard through the
// flows the docs layout promises: the skip link, the navigation sidebar, search (open, type, move through
// results, close, and follow one), the mobile drawer (open, trap focus, close, and return focus), and the
// code tabs (arrow keys, Home, End). At each step it checks which element has focus and that the focus ring
// is visible.
//
// The engine does not yet load a page's client islands (`engine.islands` builds them, the pipeline does not
// write them into a page). The gate therefore serves the theme's islands itself: it strips their types with
// the engine's own `buildIsland`, serves them under `/islands/`, and adds one module script to each page.
// That keeps the gate about keyboard behavior rather than about island wiring; when the pipeline ships the
// scripts the gate can drop the injection.
//
// The fixture has no page with code tabs yet, so the gate renders the theme's `code-tabs` component into a
// probe page. It reads only the component's own markup, so a fixture page with code tabs is used instead as
// soon as one exists.
//
// The browser is optional, as in every gate that needs one: when Playwright or Chromium is not installed the
// gate prints SKIP and exits 0. The browser job in CI installs them (`quality.ci`); a local run uses `$CHROME`,
// the system Chrome, or the browser Playwright installed.
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { extname, join, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Page as EnginePage, Site } from "../../packages/engine/src/contracts/index.ts";
import type { Page } from "playwright-core";
import { createCssBundler } from "../../packages/engine/src/render/css.ts";
import { buildIsland } from "../../packages/engine/src/render/islands.ts";
import { builtSite } from "../fixture-build/build.ts";

/** The repository root: this file sits three levels below it. */
export const root = join(fileURLToPath(import.meta.url), "../../..");

/** The fixture the gate tests. */
export const FIXTURE = "docs-site" as const;

/** The page the desktop flows use: a docs page with a sidebar, a table of contents, and search. */
export const DOC_PAGE = "/install/" as const;

/** The page the code-tabs flow uses when the fixture has none. */
export const PROBE_URL = "/__keyboard/code-tabs/" as const;

/** The widths the gate tests: a desktop with a sidebar, and a phone with the drawer. */
export const DESKTOP = { width: 1280, height: 900 } as const;
export const MOBILE = { width: 375, height: 800 } as const;

/** The query the search flow types. It matches many pages in the fixture. */
export const SEARCH_QUERY = "install" as const;

/** The query the follow-a-result step types; its first result is a different page. */
export const FOLLOW_QUERY = "troubleshooting" as const;

/** One problem found in one flow. */
export interface Finding {
  /** The page the flow ran on, such as `/install/`. */
  readonly page: string;
  /** The flow: `skip`, `sidebar`, `search`, `drawer`, or `tabs`. */
  readonly step: string;
  /** What went wrong, in one line. */
  readonly message: string;
}

/** What one run found. */
export interface Result {
  /** Every problem, in the order the flows ran. */
  readonly findings: readonly Finding[];
  /** Things the gate could not cover, such as a fixture with no code-tabs page. */
  readonly notes: readonly string[];
}

/** Adds a finding while a flow runs. */
type Add = (page: string, step: string, message: string) => void;

/** How a real run ends when the browser is not there. */
export interface KeyboardSkip {
  /** Why the gate cannot run. */
  readonly skip: string;
}

/** A browser run that can execute the flows and close what it opened. */
export interface KeyboardRun {
  /** Runs every flow once and returns what it found. */
  readonly run: () => Promise<Result>;
  /** Closes the pages, the browser, and the server. */
  readonly close: () => Promise<void>;
}

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** MIME types a built site serves. Pagefind's data files are fetched as bytes; its wasm is a wasm module. */
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
  ".pagefind": "application/wasm",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ts": "text/javascript; charset=utf-8",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

/** The content type for a file, so a browser runs islands and fetches Pagefind's data correctly. */
export function contentType(file: string): string {
  return CONTENT_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
}

/** The module script the gate adds to every page, before `</body>`. */
export const ISLAND_SCRIPT = '<script type="module" src="/islands/all.js"></script>';

/** Adds markup before `</body>` when there is one, else at the end. */
export function beforeBody(html: string, markup: string): string {
  const at = html.lastIndexOf("</body>");
  return at === -1 ? `${html}${markup}` : `${html.slice(0, at)}${markup}${html.slice(at)}`;
}

/** Adds markup before `</head>` when there is one, else at the start. */
export function beforeHead(html: string, markup: string): string {
  const at = html.lastIndexOf("</head>");
  return at === -1 ? `${markup}${html}` : `${html.slice(0, at)}${markup}${html.slice(at)}`;
}

/** Adds the island script to a page, before `</body>` when there is one, else at the end. */
export function withIslandScript(html: string): string {
  return beforeBody(html, ISLAND_SCRIPT);
}

/**
 * The theme islands the flows need. The gate loads only these, not every client in the theme: the theme
 * toggle imports the layout shell, which is server code, and the other islands do nothing for these flows.
 */
export const ISLAND_ENTRIES = [
  "chrome/drawer/client.ts",
  "chrome/search/client.ts",
  "chrome/sidebar/client.ts",
  "components/code-tabs/client.ts",
] as const;

/** A relative import in a client file, such as `import "./sync.ts"`. */
const IMPORT = /(?:^|[;{}\n])\s*import\s*(?:[^;'"]*?\bfrom\s*)?(["'])([^"'\n]+)\1/g;

/** The relative specifiers a module imports. Bare and dynamic imports are left alone. */
export function relativeImports(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(IMPORT)) {
    const specifier = match[2]!;
    if (specifier.startsWith(".")) found.push(specifier);
  }
  return found;
}

/** The browser modules the gate serves under `/islands/`: theme-relative paths to JavaScript. */
export interface Islands {
  /** `/islands/<path>` to the module source, with types stripped. */
  readonly files: ReadonlyMap<string, string>;
  /** The module `/islands/all.js`, which imports every entry once. */
  readonly all: string;
}

/**
 * Builds the browser modules for {@link ISLAND_ENTRIES}, following their relative imports so the code-tabs
 * client's `sync.ts` comes along. Each module keeps its theme path, so `./sync.ts` resolves to the module
 * the gate serves for it.
 */
export async function collectIslands(themeRoot: string): Promise<Islands> {
  const files = new Map<string, string>();
  const visited = new Set<string>();

  async function add(path: string): Promise<void> {
    if (visited.has(path)) return;
    visited.add(path);
    const absolute = join(themeRoot, path);
    if (!existsSync(absolute)) return;
    const source = readFileSync(absolute, "utf8");
    files.set(`/islands/${path}`, await buildIsland(absolute));
    for (const specifier of relativeImports(source)) {
      const target = posix.normalize(posix.join(posix.dirname(path), specifier));
      if (!target.endsWith(".ts")) continue;
      await add(target);
    }
  }

  for (const entry of ISLAND_ENTRIES) await add(entry);
  const all = [...visited]
    .filter((path) => (ISLAND_ENTRIES as readonly string[]).includes(path))
    .sort(byCodePoint)
    .map((path) => `import "/islands/${path}";`)
    .join("\n");
  return { files, all: `${all}\n` };
}

/** A page the gate serves beside the build, such as the code-tabs probe. */
export type ExtraPages = ReadonlyMap<string, string>;

/** The theme assets the gate injects while the pipeline does not write them: CSS and the search dialog. */
export interface ThemeAssets {
  /** The theme's CSS, minified and joined in cascade order. */
  readonly css: string;
  /** The search chrome's dialog, added to a page whose layout does not render it yet. */
  readonly search: string;
}

/** Adds the theme stylesheet, the search dialog when the page has a search button, and the islands. */
export function withThemeAssets(html: string, theme: ThemeAssets): string {
  let out = html;
  if (!/<link\b[^>]*\brel=["']stylesheet["']/i.test(out)) {
    out = beforeHead(out, '<link rel="stylesheet" href="/islands/theme.css">');
  }
  if (out.includes("data-search-open") && !/<dialog\b[^>]*\bdata-search\b/i.test(out)) out = beforeBody(out, theme.search);
  return withIslandScript(out);
}

/** A local server for the build, the islands, and any extra pages. */
export interface SiteServer {
  /** The origin every URL starts with. */
  readonly origin: string;
  /** Stops the server. */
  readonly close: () => Promise<void>;
}

/** Serves one built site with the gate's islands and extra pages, so root-relative URLs work as on a host. */
export async function serve(buildDir: string, islands: Islands, extra: ExtraPages, theme: ThemeAssets): Promise<SiteServer> {
  const rootDir = resolve(buildDir);

  const fileAt = (pathname: string): string | undefined => {
    const decoded = decodeURIComponent(pathname);
    const candidates = decoded.endsWith("/") ? [join(decoded, "index.html")] : [decoded, `${decoded}/index.html`];
    for (const candidate of candidates) {
      const file = resolve(rootDir, `.${candidate}`);
      if (file !== rootDir && !file.startsWith(`${rootDir}${sep}`)) continue;
      try {
        if (statSync(file).isFile()) return file;
      } catch {
        // Try the next candidate.
      }
    }
    return undefined;
  };

  const handler = (request: IncomingMessage, response: ServerResponse): void => {
    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    } catch {
      response.statusCode = 400;
      response.end("bad request");
      return;
    }

    const island = islands.files.get(pathname);
    if (island !== undefined) {
      response.setHeader("content-type", CONTENT_TYPES[".js"]!);
      response.end(island);
      return;
    }
    if (pathname === "/islands/all.js") {
      response.setHeader("content-type", CONTENT_TYPES[".js"]!);
      response.end(islands.all);
      return;
    }
    if (pathname === "/islands/theme.css") {
      response.setHeader("content-type", CONTENT_TYPES[".css"]!);
      response.end(theme.css);
      return;
    }

    const extraPage = extra.get(pathname);
    if (extraPage !== undefined) {
      response.setHeader("content-type", CONTENT_TYPES[".html"]!);
      response.end(withThemeAssets(extraPage, theme));
      return;
    }

    const file = fileAt(pathname);
    if (file === undefined) {
      response.statusCode = 404;
      try {
        response.setHeader("content-type", CONTENT_TYPES[".html"]!);
        response.end(readFileSync(join(rootDir, "404.html")));
      } catch {
        response.end("not found");
      }
      return;
    }

    const type = contentType(file);
    response.setHeader("content-type", type);
    if (type.startsWith("text/html")) {
      response.end(withThemeAssets(readFileSync(file, "utf8"), theme));
      return;
    }
    response.end(readFileSync(file));
  };

  const server: Server = createServer(handler);
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((done) => server.close(() => done())),
  };
}

/** Every HTML file under `dir`, sorted. */
function htmlFiles(dir: string): string[] {
  const found: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(current, entry.name));
      else if (entry.isFile() && entry.name.endsWith(".html")) found.push(join(current, entry.name));
    }
  };
  walk(dir);
  return found.sort(byCodePoint);
}

/** The URL a build file is served at. */
export function pageUrl(buildDir: string, file: string): string {
  const path = relative(buildDir, file).split(sep).join("/");
  if (path === "index.html") return "/";
  if (path.endsWith("/index.html")) return `/${path.slice(0, -"index.html".length)}`;
  return `/${path}`;
}

/** The first built page that renders code tabs, or `undefined` when the fixture has none. */
export function findCodeTabsPage(buildDir: string): string | undefined {
  for (const file of htmlFiles(buildDir)) {
    if (readFileSync(file, "utf8").includes("data-code-tabs")) return pageUrl(buildDir, file);
  }
  return undefined;
}

/** A page with two code-tab groups, rendered by the theme's own component. */
export async function probeHtml(): Promise<string> {
  const [{ default: codeTabs }, { renderToString }] = await Promise.all([
    import("../../packages/theme/components/code-tabs/index.ts"),
    import("preact-render-to-string"),
  ]);
  const page = {
    url: PROBE_URL,
    source: { file: "probe.md", line: 1, column: 1, endLine: 1, endColumn: 1 },
    frontMatter: {},
    title: "Code tabs",
    lang: "en",
    dir: "ltr",
    headings: [],
    html: "",
    markdown: "",
    kind: "doc",
  } as EnginePage;
  const site = { config: { base: "" }, pages: [], nav: {}, data: {} } as unknown as Site;
  const body = renderToString(
    codeTabs({
      props: { id: "keyboard-probe", labels: '["npm","pnpm"]' },
      html: "<pre><code>npm install -g beacon</code></pre><pre><code>pnpm add -g beacon</code></pre>",
      page,
      site,
    }),
  );
  return `<!DOCTYPE html><html lang="en" dir="ltr"><head><meta charset="utf-8"><title>Code tabs</title></head><body><main id="main">${body}</main></body></html>`;
}

/** The base stylesheets every page loads, in cascade order. */
export const BASE_STYLES = ["styles/tokens.css", "styles/fonts.css", "styles/base.css"] as const;

/** Every unit stylesheet the theme ships, sorted, so the probe and the built pages share one bundle. */
export function unitStyles(themeRoot: string): string[] {
  const found: string[] = [];
  for (const folder of ["chrome", "components", "layouts"]) {
    const at = join(themeRoot, folder);
    if (!existsSync(at)) continue;
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      const file = entry.isDirectory() ? join(folder, entry.name, "style.css") : entry.isFile() ? join(folder, entry.name) : "";
      if (file !== "" && file.endsWith(".css") && existsSync(join(themeRoot, file))) found.push(file);
    }
  }
  return found.sort(byCodePoint);
}

/** Builds the theme's CSS and the search dialog, the two assets the pipeline does not write yet. */
export async function themeAssets(themeRoot: string): Promise<ThemeAssets> {
  const bundler = createCssBundler({ themeRoot, base: BASE_STYLES });
  const { base, page } = await bundler.page(unitStyles(themeRoot));
  const [{ default: search }, { renderToString }] = await Promise.all([
    import("../../packages/theme/chrome/search/index.ts"),
    import("preact-render-to-string"),
  ]);
  const fakePage = {
    url: "/",
    source: { file: "probe.md", line: 1, column: 1, endLine: 1, endColumn: 1 },
    frontMatter: {},
    title: "",
    lang: "en",
    dir: "ltr",
    headings: [],
    html: "",
    markdown: "",
    kind: "doc",
  } as EnginePage;
  const fakeSite = { config: { base: "" }, pages: [], nav: {}, data: {} } as unknown as Site;
  const node = search({ site: fakeSite, page: fakePage, trail: [], pager: {} });
  const dialog = typeof node === "string" ? node : renderToString(node as Parameters<typeof renderToString>[0]);
  return { css: `${base.css}\n${page?.css ?? ""}`, search: dialog };
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

/** What one focused element looks like, for a failure message. */
export async function focusLabel(page: Page): Promise<string> {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (element === null || element === document.body) return "body";
    const text = (element.getAttribute("aria-label") ?? element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${text ? ` "${text}"` : ""}`;
  });
}

/** True when the focused element draws a focus ring: an outline or a box shadow. */
export async function focusVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (element === null || element === document.body) return false;
    const style = getComputedStyle(element);
    const outline = style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0;
    return outline || (style.boxShadow !== "none" && style.boxShadow !== "");
  });
}

/**
 * Presses Tab until the focused element is inside `selector`, at most `max` times. Returns the number of
 * presses, or `undefined` when the selector is never reached.
 */
export async function tabTo(page: Page, selector: string, max = 40): Promise<number | undefined> {
  for (let presses = 1; presses <= max; presses++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate((target) => Boolean(document.activeElement?.closest(target)), selector);
    if (inside) return presses;
  }
  return undefined;
}

/** Where each selector first gets focus in one Tab walk from the current position. */
export async function tabTrace(page: Page, selectors: readonly string[], max = 80): Promise<Map<string, number>> {
  const order = new Map<string, number>();
  for (let presses = 1; presses <= max; presses++) {
    await page.keyboard.press("Tab");
    const hits = await page.evaluate((targets) => {
      const element = document.activeElement;
      if (element === null || element === document.body) return [] as number[];
      return targets.flatMap((target, index) => (element.closest(target) === null ? [] : [index]));
    }, selectors);
    for (const index of hits) {
      const selector = selectors[index]!;
      if (!order.has(selector)) order.set(selector, presses);
    }
    if (order.size === selectors.length) break;
  }
  return order;
}

/** Asserts every selector is reached, in the order given. */
function orderFindings(page: string, step: string, selectors: readonly string[], order: Map<string, number>, add: Add): void {
  let previous = -1;
  for (const selector of selectors) {
    const at = order.get(selector);
    if (at === undefined) {
      add(page, step, `Tab never reached ${selector}`);
      continue;
    }
    if (at <= previous) add(page, step, `${selector} comes before the control that should precede it`);
    previous = at;
  }
}

/** Opens a URL and waits for the page, including its island module, to load. */
async function open(page: Page, origin: string, url: string): Promise<void> {
  await page.goto(`${origin}${url}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
}

/** The skip link is the first stop and moves focus to the main landmark. */
async function scenarioSkip(page: Page, origin: string, add: Add): Promise<void> {
  await open(page, origin, DOC_PAGE);
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement?.classList.contains("skip-link") === true);
  if (!first) {
    add(DOC_PAGE, "skip", `the first Tab focused ${await focusLabel(page)}, not the skip link`);
    return;
  }
  if (!(await focusVisible(page))) add(DOC_PAGE, "skip", "the skip link has no visible focus");
  const href = await page.evaluate(() => document.activeElement?.getAttribute("href"));
  if (href !== "#main") add(DOC_PAGE, "skip", `the skip link points at ${href ?? "nothing"}, not #main`);
  await page.keyboard.press("Enter");
  const focusedMain = await page
    .waitForFunction(() => document.activeElement?.id === "main", undefined, { timeout: 2000 })
    .then(() => true)
    .catch(() => false);
  if (!focusedMain) add(DOC_PAGE, "skip", `Enter on the skip link left focus on ${await focusLabel(page)}, not main`);
}

/** The sidebar comes after the header in the Tab order, and a group opens and closes from the keyboard. */
async function scenarioSidebar(page: Page, origin: string, add: Add): Promise<void> {
  await open(page, origin, DOC_PAGE);
  if (!(await page.locator("aside.sidebar").isVisible())) {
    add(DOC_PAGE, "sidebar", "the sidebar is not visible at the desktop width");
    return;
  }
  const order = await tabTrace(page, [".skip-link", "[data-search-open]", "aside.sidebar"], 60);
  orderFindings(DOC_PAGE, "sidebar", [".skip-link", "[data-search-open]", "aside.sidebar"], order, add);

  const atSummary = await tabTo(page, "aside.sidebar summary", 30);
  if (atSummary === undefined) {
    add(DOC_PAGE, "sidebar", "no sidebar group summary is reachable by Tab");
    return;
  }
  if (!(await focusVisible(page))) add(DOC_PAGE, "sidebar", "the sidebar summary has no visible focus");

  const before = await page.evaluate(() => (document.activeElement?.closest("details") as HTMLDetailsElement | null)?.open ?? null);
  await page.keyboard.press("Enter");
  const after = await page.evaluate(() => (document.activeElement?.closest("details") as HTMLDetailsElement | null)?.open ?? null);
  if (before === null || after === null || before === after) {
    add(DOC_PAGE, "sidebar", "Enter on a sidebar summary did not open or close its group");
  }
}

/** Search opens from the keyboard, shows results, moves through them, closes, and follows one. */
async function scenarioSearch(page: Page, origin: string, add: Add): Promise<void> {
  await open(page, origin, DOC_PAGE);
  const order = await tabTrace(page, [".skip-link", "[data-search-open]", "aside.sidebar"], 60);
  orderFindings(DOC_PAGE, "search", [".skip-link", "[data-search-open]", "aside.sidebar"], order, add);

  await open(page, origin, DOC_PAGE);
  if ((await tabTo(page, "[data-search-open]", 10)) === undefined) {
    add(DOC_PAGE, "search", "the search button is not reachable by Tab");
    return;
  }
  if (!(await focusVisible(page))) add(DOC_PAGE, "search", "the search button has no visible focus");
  await page.keyboard.press("Enter");

  const opened = await page
    .waitForFunction(() => (document.querySelector("[data-search]") as HTMLDialogElement | null)?.open === true, undefined, {
      timeout: 2000,
    })
    .then(() => true)
    .catch(() => false);
  if (!opened) {
    add(DOC_PAGE, "search", "Enter on the search button did not open the dialog");
    return;
  }
  const inputFocused = await page.evaluate(() => document.activeElement?.id === "search-input");
  if (!inputFocused) add(DOC_PAGE, "search", `the search dialog focused ${await focusLabel(page)}, not its field`);
  if (!(await focusVisible(page))) add(DOC_PAGE, "search", "the search field has no visible focus");

  await page.keyboard.type(SEARCH_QUERY);
  const hasResults = await page
    .waitForSelector(".search-result-link", { timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (!hasResults) {
    add(DOC_PAGE, "search", `typing "${SEARCH_QUERY}" showed no results`);
    return;
  }

  await page.keyboard.press("ArrowDown");
  const onResult = await page.evaluate(() => Boolean(document.activeElement?.closest(".search-result-link")));
  if (!onResult) add(DOC_PAGE, "search", `ArrowDown focused ${await focusLabel(page)}, not the first result`);
  if (!(await focusVisible(page))) add(DOC_PAGE, "search", "the focused result has no visible focus");

  await page.keyboard.press("Escape");
  const closed = await page
    .waitForFunction(() => (document.querySelector("[data-search]") as HTMLDialogElement | null)?.open === false, undefined, {
      timeout: 2000,
    })
    .then(() => true)
    .catch(() => false);
  if (!closed) add(DOC_PAGE, "search", "Escape did not close the search dialog");
  const returned = await page.evaluate(() => Boolean(document.activeElement?.closest("[data-search-open]")));
  if (!returned) add(DOC_PAGE, "search", "closing search did not return focus to the search button");

  // Open again and follow a result with Enter; the page must navigate to the result's URL.
  const onButton = await page.evaluate(() => Boolean(document.activeElement?.closest("[data-search-open]")));
  if (!onButton && (await tabTo(page, "[data-search-open]", 10)) === undefined) {
    add(DOC_PAGE, "search", "the search button is not reachable again after closing");
    return;
  }
  await page.keyboard.press("Enter");
  const reopened = await page
    .waitForFunction(() => (document.querySelector("[data-search]") as HTMLDialogElement | null)?.open === true, undefined, {
      timeout: 2000,
    })
    .then(() => true)
    .catch(() => false);
  if (!reopened) {
    add(DOC_PAGE, "search", "the search dialog did not open a second time");
    return;
  }
  await page.fill("#search-input", "");
  await page.keyboard.type(FOLLOW_QUERY);
  const hasFollowResults = await page
    .waitForSelector(".search-result-link", { timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (!hasFollowResults) {
    add(DOC_PAGE, "search", `typing "${FOLLOW_QUERY}" showed no results`);
    return;
  }
  // A result may render just after the selector matches, and a debounced search can ignore the first keypress.
  // Press until a result link really has focus, and only then call it a finding.
  let href: string | null = null;
  for (let attempt = 0; attempt < 3 && href === null; attempt += 1) {
    await page.keyboard.press("ArrowDown");
    href = await page
      .waitForFunction(
        () => {
          const active = document.activeElement;
          return active instanceof HTMLAnchorElement ? active.getAttribute("href") : null;
        },
        undefined,
        { timeout: 1500 },
      )
      .then((handle) => handle.jsonValue() as Promise<string | null>)
      .catch(() => null);
  }
  if (href === null) {
    add(DOC_PAGE, "search", "the focused result has no href");
    return;
  }
  const target = new URL(href, page.url());
  await page.keyboard.press("Enter");
  const navigated = await page
    .waitForURL((url) => url.pathname === target.pathname, { timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (!navigated) add(DOC_PAGE, "search", `Enter on a result did not open ${href}`);
  else await page.waitForLoadState("load").catch(() => {});
}

/** The drawer opens from the menu button, keeps Tab inside, closes with Escape or its button, and returns focus. */
async function scenarioDrawer(page: Page, origin: string, add: Add): Promise<void> {
  await open(page, origin, DOC_PAGE);
  if (await page.locator("aside.sidebar").isVisible()) {
    add(DOC_PAGE, "drawer", "the desktop sidebar is still visible at the phone width");
  }
  const order = await tabTrace(page, [".skip-link", "[data-search-open]", "[data-drawer-open]"], 40);
  orderFindings(DOC_PAGE, "drawer", [".skip-link", "[data-search-open]", "[data-drawer-open]"], order, add);

  const onMenu = await page.evaluate(() => Boolean(document.activeElement?.closest("[data-drawer-open]")));
  if (!onMenu && (await tabTo(page, "[data-drawer-open]", 10)) === undefined) {
    add(DOC_PAGE, "drawer", "the menu button is not reachable by Tab");
    return;
  }
  if (!(await focusVisible(page))) add(DOC_PAGE, "drawer", "the menu button has no visible focus");

  await page.keyboard.press("Enter");
  const opened = await page
    .waitForFunction(() => (document.querySelector("[data-drawer]") as HTMLDialogElement | null)?.open === true, undefined, {
      timeout: 2000,
    })
    .then(() => true)
    .catch(() => false);
  if (!opened) {
    add(DOC_PAGE, "drawer", "Enter on the menu button did not open the drawer");
    return;
  }
  const inside = await page.evaluate(() => Boolean(document.activeElement?.closest("[data-drawer]")));
  if (!inside) add(DOC_PAGE, "drawer", `the drawer focused ${await focusLabel(page)}, outside itself`);
  if (!(await focusVisible(page))) add(DOC_PAGE, "drawer", "the drawer's first control has no visible focus");

  for (let presses = 0; presses < 12; presses++) {
    await page.keyboard.press("Tab");
    const stillInside = await page.evaluate(() => Boolean(document.activeElement?.closest("[data-drawer]")));
    if (!stillInside) {
      add(DOC_PAGE, "drawer", `Tab left the drawer after ${presses + 1} press(es), on ${await focusLabel(page)}`);
      break;
    }
  }

  await page.keyboard.press("Escape");
  const closed = await page
    .waitForFunction(() => (document.querySelector("[data-drawer]") as HTMLDialogElement | null)?.open === false, undefined, {
      timeout: 2000,
    })
    .then(() => true)
    .catch(() => false);
  if (!closed) add(DOC_PAGE, "drawer", "Escape did not close the drawer");
  const returned = await page.evaluate(() => Boolean(document.activeElement?.closest("[data-drawer-open]")));
  if (!returned) add(DOC_PAGE, "drawer", "closing the drawer did not return focus to the menu button");

  // Open again and close with the drawer's own button, which is the first control it focuses.
  await page.keyboard.press("Enter");
  const reopened = await page
    .waitForFunction(() => (document.querySelector("[data-drawer]") as HTMLDialogElement | null)?.open === true, undefined, {
      timeout: 2000,
    })
    .then(() => true)
    .catch(() => false);
  if (!reopened) {
    add(DOC_PAGE, "drawer", "the menu button did not reopen the drawer");
    return;
  }
  await page.keyboard.press("Enter");
  const closedByButton = await page
    .waitForFunction(() => (document.querySelector("[data-drawer]") as HTMLDialogElement | null)?.open === false, undefined, {
      timeout: 2000,
    })
    .then(() => true)
    .catch(() => false);
  if (!closedByButton) add(DOC_PAGE, "drawer", "Enter on the drawer's close button did not close it");
}

/** The code tabs move with the arrow keys and Home/End, and show exactly one panel at a time. */
async function scenarioTabs(page: Page, origin: string, add: Add, url: string): Promise<void> {
  await open(page, origin, url);
  const enhanced = await page
    .waitForSelector("[data-code-tabs][data-enhanced]", { timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (!enhanced) {
    add(url, "tabs", "the code-tabs island did not turn the group into tabs");
    return;
  }

  if ((await tabTo(page, "[role=tab]", 20)) === undefined) {
    add(url, "tabs", "the first code tab is not reachable by Tab");
    return;
  }
  if (!(await focusVisible(page))) add(url, "tabs", "the focused code tab has no visible focus");

  const state = () =>
    page.evaluate(() => {
      const tabs = [...document.querySelectorAll("[role=tab]")];
      const panels = [...document.querySelectorAll(".code-tabs-panel")];
      return {
        selected: tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true"),
        hidden: panels.map((panel) => (panel as HTMLElement).hidden),
      };
    });

  let before = await state();
  if (before.selected !== 0) add(url, "tabs", `the group starts on tab ${before.selected + 1}, not the first`);

  await page.keyboard.press("ArrowRight");
  let after = await state();
  if (after.selected !== 1) add(url, "tabs", `ArrowRight selected tab ${after.selected + 1}, not the second`);
  if (after.hidden[1] !== false || after.hidden.filter(Boolean).length !== after.hidden.length - 1) {
    add(url, "tabs", "ArrowRight did not show exactly the selected panel");
  }
  if (!(await focusVisible(page))) add(url, "tabs", "the tab focused by ArrowRight has no visible focus");

  await page.keyboard.press("End");
  after = await state();
  if (after.selected !== after.hidden.length - 1) add(url, "tabs", "End did not select the last tab");

  await page.keyboard.press("Home");
  after = await state();
  if (after.selected !== 0) add(url, "tabs", "Home did not select the first tab");

  await page.keyboard.press("ArrowLeft");
  after = await state();
  if (after.selected !== after.hidden.length - 1) add(url, "tabs", "ArrowLeft did not wrap to the last tab");

  before = after;
  if (before.hidden.filter(Boolean).length !== before.hidden.length - 1) {
    add(url, "tabs", "more than one code panel is visible");
  }
}

/** Opens Chromium and a local server for `buildDir`, ready to run the flows. */
export async function keyboardRun(buildDir: string): Promise<KeyboardRun | KeyboardSkip> {
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

  const themeRoot = join(root, "packages/theme");
  let islands: Islands;
  try {
    islands = await collectIslands(themeRoot);
  } catch (err) {
    return { skip: `the theme islands did not build: ${err instanceof Error ? err.message : String(err)}` };
  }

  let theme: ThemeAssets;
  try {
    theme = await themeAssets(themeRoot);
  } catch (err) {
    return { skip: `the theme CSS or search chrome did not build: ${err instanceof Error ? err.message : String(err)}` };
  }

  const tabsPage = findCodeTabsPage(buildDir);
  const extra = new Map<string, string>();
  if (tabsPage === undefined) extra.set(PROBE_URL, await probeHtml());
  const tabsUrl = tabsPage ?? PROBE_URL;

  const server = await serve(buildDir, islands, extra, theme);
  let browser: Awaited<ReturnType<typeof chromium.launch>>;
  try {
    browser = await chromium.launch({ executablePath, headless: true });
  } catch (err) {
    await server.close();
    throw err;
  }

  const desktop = await browser.newContext({ viewport: DESKTOP, colorScheme: "light" });
  const mobile = await browser.newContext({ viewport: MOBILE, colorScheme: "light" });

  const run = async (): Promise<Result> => {
    const findings: Finding[] = [];
    const add: Add = (page, step, message) => findings.push({ page, step, message });

    const withPage = async (context: typeof desktop, scenario: (page: Page) => Promise<void>): Promise<void> => {
      const page = await context.newPage();
      try {
        await scenario(page);
      } finally {
        await page.close();
      }
    };

    await withPage(desktop, (page) => scenarioSkip(page, server.origin, add));
    await withPage(desktop, (page) => scenarioSidebar(page, server.origin, add));
    await withPage(desktop, (page) => scenarioSearch(page, server.origin, add));
    await withPage(desktop, (page) => scenarioTabs(page, server.origin, add, tabsUrl));
    await withPage(mobile, (page) => scenarioDrawer(page, server.origin, add));

    const pages = htmlFiles(buildDir);
    const hasStylesheet = pages.some((file) => /<link\b[^>]*\brel=["']stylesheet["']/i.test(readFileSync(file, "utf8")));
    const hasSearchDialog = pages.some((file) => /<dialog\b[^>]*\bdata-search\b/i.test(readFileSync(file, "utf8")));
    const notes = [
      ...(hasStylesheet ? [] : ["the fixture build has no stylesheet links; the gate injected the theme's CSS."]),
      ...(hasSearchDialog ? [] : ["the fixture pages do not render the search dialog; the gate injected the theme's search chrome."]),
      ...(tabsPage === undefined ? [`fixtures/${FIXTURE} has no page with code tabs; the gate tested a rendered probe page.`] : []),
    ];
    return { findings, notes };
  };

  return {
    run,
    close: async () => {
      await desktop.close();
      await mobile.close();
      await browser.close();
      await server.close();
    },
  };
}

/** Prints the findings and says whether the gate passed. */
export function report(result: Result, pages = 3): boolean {
  for (const note of result.notes) console.log(`note: ${note}`);
  for (const finding of result.findings) console.error(`FAIL ${finding.page} ${finding.step}: ${finding.message}`);
  if (result.findings.length > 0) {
    console.error(`FAIL: keyboard: ${result.findings.length} problem(s) across ${pages} page(s).`);
    return false;
  }
  console.log(`OK: keyboard (${pages} page(s): skip link, sidebar, search, drawer, code tabs)`);
  return true;
}

/** Builds the fixture, or uses `--site`, and runs the flows; the gate's entry point. */
export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const at = argv.indexOf("--site");
  let buildDir: string;
  if (at !== -1) {
    buildDir = argv[at + 1] ?? "";
    if (buildDir === "" || !existsSync(buildDir)) {
      console.error(`FAIL: keyboard: ${buildDir === "" ? "--site needs a folder" : `${buildDir} does not exist`}`);
      return 1;
    }
  } else {
    try {
      buildDir = await builtSite(FIXTURE);
    } catch (err) {
      console.error(`FAIL: keyboard: the ${FIXTURE} fixture did not build: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
  }

  let run: KeyboardRun | KeyboardSkip;
  try {
    run = await keyboardRun(buildDir);
  } catch (err) {
    console.error(`FAIL: keyboard: could not start the browser: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
  if ("skip" in run) {
    console.log(`SKIP: keyboard: ${run.skip}`);
    return 0;
  }

  try {
    const result = await run.run();
    return report(result) ? 0 : 1;
  } finally {
    await run.close();
  }
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
