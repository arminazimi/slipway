// No-JavaScript gate (issue #1156): a docs page must read with JavaScript off.
//
//   node tools/nojs-engine/run.ts                audit the engine build of fixtures/docs-site
//   node tools/nojs-engine/run.ts --site <dir>   audit an already built site instead
//   node tools/nojs-engine/run.ts --all          open every page in the browser pass, not the sample
//
// JavaScript is optional in Slipway: the article, the sidebar, the table of contents, the pager, and every
// code block render on the server, and links between them are ordinary anchors. This gate reads the engine's
// build of `fixtures/docs-site` (through the shared fixture build, issue #1146) and checks every page as HTML:
// the four parts are present, each code block has text, and every link in the nav, table of contents, and
// pager resolves to a page and an anchor that exist.
//
// A static check cannot see CSS that hides content until an island runs, so the gate then opens a sample of
// the pages in Chromium with `javaScriptEnabled: false` and checks the same parts are visible. Playwright is
// an optional tool, never a dependency of the repository (CI runs Node only, `.github/workflows/ci.yml`), so
// when it or its browsers are missing the gate prints SKIP and exits 0, like every other browser gate.
import { createReadStream, existsSync, statSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { extname, join, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { builtSite } from "../fixture-build/build.ts";

/** The repository root: this file sits three levels below it. */
export const root = join(fileURLToPath(import.meta.url), "../../..");

/** One problem found on one page. `rule` names the part, so the same words appear in every report. */
export interface Finding {
  /** Page path relative to the build folder, with forward slashes. */
  readonly page: string;
  /** The part that failed: `main`, `article`, `sidebar`, `toc`, `pager`, `code`, or `links`. */
  readonly rule: string;
  /** What is wrong, in one line. */
  readonly message: string;
}

/** A built site: every HTML file, by page path relative to the folder, in sorted order. */
export interface Site {
  /** The build folder the pages were read from. */
  readonly dir: string;
  /** Page path (`install/index.html`) to file contents. */
  readonly pages: ReadonlyMap<string, string>;
}

/** Files the gate reads: the engine's HTML output only. */
const HTML = /\.html?$/i;

/** A scheme (`https:`, `mailto:`) or a protocol-relative URL, which leaves the site. */
const EXTERNAL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Every page under `dir`, keyed by its forward-slash path and sorted, so the report is stable. */
export async function readSite(dir: string): Promise<Site> {
  const pages = new Map<string, string>();
  async function walk(folder: string): Promise<void> {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && HTML.test(entry.name)) {
        pages.set(relative(dir, path).split(sep).join("/"), await readFile(path, "utf8"));
      }
    }
  }
  await walk(dir);
  return { dir, pages: new Map([...pages].sort(([a], [b]) => byCodePoint(a, b))) };
}

/** True for a page the docs layout built: the article or the sidebar is there, even when the other is broken. */
export function isDocPage(html: string): boolean {
  return /<article\b[^>]*\bclass="[^"]*\bdoc\b/i.test(html) || /<aside\b[^>]*\bclass="[^"]*\bsidebar\b/i.test(html);
}

/** The inside of the first `<tag class="... name ...">`, or `undefined`. */
function region(html: string, tag: string, name: string): string | undefined {
  const open = new RegExp(`<${tag}\\b[^>]*\\bclass="[^"]*\\b${name}\\b[^"]*"[^>]*>`, "i");
  const match = open.exec(html);
  if (match === null) return undefined;
  const rest = html.slice(match.index + match[0].length);
  const close = rest.search(new RegExp(`</${tag}>`, "i"));
  return close === -1 ? undefined : rest.slice(0, close);
}

/** The text a reader sees: scripts, styles, and tags removed. */
function textOf(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The URL path of a page, so a href can be resolved against it: `install/index.html` is `/install/`. */
export function urlOf(page: string): string {
  if (page === "index.html") return "/";
  return `/${page.replace(/(?:^|\/)index\.html$/i, "/").replace(/\/+$/, "/")}`;
}

/** A `href` split into the build path it names and its `#anchor`; `undefined` when it leaves the site. */
export function targetOf(page: string, href: string): { path: string; anchor: string } | undefined {
  if (EXTERNAL.test(href) || href === "") return undefined;
  const clean = href.split("?")[0] ?? "";
  const hash = clean.indexOf("#");
  const anchor = hash === -1 ? "" : clean.slice(hash + 1);
  const named = (hash === -1 ? clean : clean.slice(0, hash)).replace(/&amp;/g, "&");
  if (named === "") return { path: page, anchor };
  let decoded = named;
  try {
    decoded = decodeURIComponent(named);
  } catch {
    // A malformed escape stays literal; the file check below reports it when it does not exist.
  }
  if (decoded.startsWith("/")) return { path: decoded.slice(1), anchor };
  return { path: posix.normalize(posix.join(posix.dirname(page), decoded)), anchor };
}

/** The file a build path names: a folder is its `index.html`. Returns `undefined` when nothing is there. */
function fileOf(site: Site, path: string): string | undefined {
  const trimmed = path.replace(/^\/+/, "");
  const candidates = trimmed === "" || trimmed.endsWith("/") ? [`${trimmed}index.html`] : [trimmed, `${trimmed}/index.html`];
  return candidates.find((candidate) => {
    if (candidate === "") return false;
    const path = join(site.dir, candidate);
    return existsSync(path) && statSync(path).isFile();
  })?.replace(/^\/+/, "");
}

/** Whether `fragment` names an id (or an old-style `name`) on the page. */
function hasAnchor(html: string, fragment: string): boolean {
  const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b(?:id|name)="${escaped}"`, "i").test(html);
}

/** Every `href` inside `html`, in document order. */
function hrefs(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)].map((match) => match[1] ?? "");
}

/** Resolves one link; appends a `links` finding when its page or anchor is missing. */
function checkLinks(page: string, hrefsToCheck: readonly string[], site: Site, add: (rule: string, message: string) => void): void {
  for (const href of hrefsToCheck) {
    const target = targetOf(page, href);
    if (target === undefined) continue;
    const file = fileOf(site, target.path);
    if (file === undefined) {
      add("links", `\`${href}\` names no file in the build`);
      continue;
    }
    const html = site.pages.get(file);
    if (target.anchor !== "" && html !== undefined && !hasAnchor(html, target.anchor)) {
      add("links", `\`${href}\` names no anchor on ${file}`);
    }
  }
}

/** The static checks for one page: every part is there, every code block has text, and chrome links resolve. */
export function checkPage(page: string, html: string, site: Site): Finding[] {
  const findings: Finding[] = [];
  const add = (rule: string, message: string): void => {
    findings.push({ page, rule, message });
  };

  if (!/<main\b[^>]*\bid="main"/i.test(html)) add("main", "no `<main id=\"main\">` landmark");
  const article = region(html, "article", "doc");
  if (article === undefined) add("article", "no `article.doc`; the page has no content column");
  else if (textOf(article).length < 20) add("article", "`article.doc` is empty");

  const sidebar = region(html, "aside", "sidebar");
  if (sidebar === undefined) add("sidebar", "no `aside.sidebar`; the page has no navigation column");
  else if (hrefs(sidebar).length === 0) add("sidebar", "`aside.sidebar` holds no links");

  const headings = article === undefined ? [] : [...article.matchAll(/<h[23]\b[^>]*\bid="[^"]+"/gi)];
  const toc = region(html, "aside", "toc");
  if (headings.length >= 2) {
    if (toc === undefined) add("toc", `the page has ${headings.length} section headings but no \`aside.toc\``);
    else if (hrefs(toc).length === 0) add("toc", "`aside.toc` holds no links");
  }

  const pager = region(html, "nav", "pager");
  if (pager !== undefined && hrefs(pager).length === 0) add("pager", "`nav.pager` holds no links");

  for (const [index, block] of [...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi)].entries()) {
    const code = /<code\b[^>]*>([\s\S]*?)<\/code>/i.exec(block[1] ?? "");
    if (code === null) add("code", `code block ${index + 1} has no \`code\` element`);
    else if (textOf(code[1] ?? "") === "") add("code", `code block ${index + 1} is empty`);
  }

  checkLinks(page, hrefs(sidebar ?? ""), site, add);
  checkLinks(page, hrefs(toc ?? ""), site, add);
  checkLinks(page, hrefs(pager ?? ""), site, add);

  return findings;
}

/** Every static finding on a built site, in page order. */
export function audit(site: Site): Finding[] {
  const findings: Finding[] = [];
  for (const [page, html] of site.pages) {
    if (!isDocPage(html)) continue;
    findings.push(...checkPage(page, html, site));
  }
  return findings;
}

/** The pages the browser pass opens by default: a deterministic sample that covers each part and depth. */
export function sample(site: Site): string[] {
  const doc = [...site.pages].filter(([, html]) => isDocPage(html));
  const chosen = new Set<string>();
  const take = (predicate: (page: string, html: string) => boolean): void => {
    const match = doc.find(([page, html]) => !chosen.has(page) && predicate(page, html));
    if (match !== undefined) chosen.add(match[0]);
  };
  const [first] = doc[0] ?? [];
  const [last] = doc[doc.length - 1] ?? [];
  if (first !== undefined) chosen.add(first);
  if (last !== undefined) chosen.add(last);
  take((page) => page === "index.html");
  take((page) => page.split("/").length > 2);
  take((page, html) => region(html, "aside", "toc") !== undefined);
  take((page, html) => region(html, "nav", "pager") !== undefined);
  take((page, html) => /<pre\b/i.test(html));
  for (const [page] of doc) {
    if (chosen.size >= 8) break;
    chosen.add(page);
  }
  return [...chosen].sort(byCodePoint);
}

/** A file server for the build folder, so root-absolute links (`/install/`) work as they do on a site. */
export function serve(dir: string): Promise<{ url: string; close: () => Promise<void> }> {
  const types: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".woff2": "font/woff2",
    ".xml": "application/xml; charset=utf-8",
  };
  const server: Server = createServer((request, response) => {
    void (async () => {
      let pathname: string;
      try {
        pathname = decodeURIComponent((request.url ?? "/").split("?")[0] ?? "/");
      } catch {
        response.writeHead(400).end("bad request");
        return;
      }
      let file = resolve(dir, `.${pathname}`);
      if (file !== dir && !file.startsWith(dir + sep)) {
        response.writeHead(403).end("forbidden");
        return;
      }
      try {
        if ((await stat(file)).isDirectory()) file = join(file, "index.html");
        if (!(await stat(file)).isFile()) throw new Error("not a file");
      } catch {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("not found");
        return;
      }
      response.writeHead(200, { "content-type": types[extname(file).toLowerCase()] ?? "application/octet-stream" });
      createReadStream(file).pipe(response);
    })();
  });
  return new Promise((resolveServe, rejectServe) => {
    server.once("error", rejectServe);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        rejectServe(new Error("the file server did not get a port"));
        return;
      }
      resolveServe({
        url: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

/** A working Playwright: the `chromium` type and the launch options that found a browser. */
export interface BrowserRuntime {
  readonly chromium: any;
  readonly launch: Readonly<Record<string, unknown>>;
}

/** Playwright's `chromium`, when the optional package is installed and a browser launches. */
export async function browser(): Promise<BrowserRuntime | undefined> {
  let chromium: any;
  try {
    const specifier = "playwright";
    const loaded = await import(specifier);
    chromium = loaded.chromium;
  } catch {
    return undefined;
  }
  if (typeof chromium?.launch !== "function") return undefined;
  // The bundled browser first; a machine that blocked the download can still have Chrome installed.
  for (const launch of [{}, { channel: "chrome" }]) {
    try {
      const probe = await chromium.launch(launch);
      await probe.close();
      return { chromium, launch };
    } catch {
      // Try the next way to find a browser.
    }
  }
  return undefined;
}

/** Opens `paths` with JavaScript disabled and checks each part is visible. */
export async function auditInBrowser(site: Site, runtime: BrowserRuntime, paths: readonly string[]): Promise<Finding[]> {
  const findings: Finding[] = [];
  const launched = await runtime.chromium.launch(runtime.launch);
  const context = await launched.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const server = await serve(site.dir);
  const add = (name: string, rule: string, message: string): void => {
    findings.push({ page: name, rule, message });
  };
  const visible = async (selector: string): Promise<boolean> => {
    const locator = page.locator(selector).first();
    return (await locator.count()) > 0 && (await locator.isVisible());
  };
  try {
    for (const name of paths) {
      const html = site.pages.get(name) ?? "";
      await page.goto(`${server.url}${urlOf(name)}`, { waitUntil: "load" });
      if (!(await visible("main#main"))) add(name, "main", "`main#main` is not visible");
      if (!(await visible("article.doc"))) add(name, "article", "`article.doc` is not visible");
      else if ((await page.locator("article.doc").first().innerText()).trim().length < 20) add(name, "article", "`article.doc` is empty");
      if (!(await visible("aside.sidebar"))) add(name, "sidebar", "`aside.sidebar` is not visible");
      else if (!(await visible("aside.sidebar a"))) add(name, "sidebar", "`aside.sidebar` shows no link");
      if (region(html, "aside", "toc") !== undefined && !(await visible("aside.toc"))) add(name, "toc", "`aside.toc` is not visible");
      if (region(html, "nav", "pager") !== undefined) {
        if (!(await visible("nav.pager"))) add(name, "pager", "`nav.pager` is not visible");
        else if (!(await visible("nav.pager a"))) add(name, "pager", "`nav.pager` shows no link");
      }
      const blocks = page.locator("article.doc pre code");
      for (let index = 0; index < (await blocks.count()); index++) {
        const block = blocks.nth(index);
        if (!(await block.isVisible())) add(name, "code", `code block ${index + 1} is not visible`);
        else if ((await block.innerText()).trim() === "") add(name, "code", `code block ${index + 1} is empty`);
      }
    }
  } finally {
    await context.close();
    await launched.close();
    await server.close();
  }
  return findings;
}

/** Prints findings one per line; returns the process exit code. */
export function report(findings: readonly Finding[], pages: number): number {
  for (const finding of findings) console.error(`${finding.page}  ${finding.rule}  ${finding.message}`);
  if (findings.length > 0) {
    console.error(`nojs-engine: ${findings.length} problem(s) on ${pages} page(s).`);
    return 1;
  }
  console.log(`nojs-engine: ok (${pages} page(s))`);
  return 0;
}

/** Runs the gate. `site` audits an already built folder instead of building the fixture; `all` opens every page. */
export async function main(argv = process.argv.slice(2)): Promise<number> {
  const all = argv.includes("--all");
  const at = argv.indexOf("--site");
  const dir = at === -1 ? await builtSite("docs-site") : (argv[at + 1] ?? "");
  if (dir === "" || !existsSync(dir)) {
    console.error(`nojs-engine: ${dir === "" ? "--site needs a folder" : `${dir} does not exist`}`);
    return 1;
  }
  const site = await readSite(dir);
  const findings = audit(site);
  const docPages = [...site.pages.values()].filter(isDocPage).length;
  if (findings.length > 0) return report(findings, docPages);

  const chromium = await browser();
  if (chromium === undefined) {
    console.log("SKIP: Playwright and its browsers are not installed (`npx playwright install chromium`); the browser pass did not run.");
    return report([], docPages);
  }
  const paths = all ? [...site.pages].filter(([, html]) => isDocPage(html)).map(([page]) => page) : sample(site);
  const browserFindings = await auditInBrowser(site, chromium, paths);
  return report(browserFindings, paths.length);
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? "")).href) process.exitCode = await main();
