// The engine's JavaScript budget: every page may load at most 30 KB of Brotli-compressed scripts.
//
//   node tools/js-budget-engine/run.ts             build both fixtures and check them
//   node tools/js-budget-engine/run.ts <build>     check one engine build folder
//
// A page loads its `<script src>` files, its inline scripts, and the static imports of its module scripts.
// Each distinct script is counted once per page, compressed with Brotli at its maximum quality, so a page's
// total is what a browser would download on the best day. A script the gate cannot measure (a URL outside
// the build folder, a bare module specifier, or a missing file) fails the gate: a page is never under budget
// by accident. The report lists the largest files so a failure names what to shrink.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { brotliCompressSync, constants } from "node:zlib";
import { builtSite, FIXTURES, type FixtureName } from "../fixture-build/build.ts";

/** The ceiling for one page: 30 KiB of compressed JavaScript. */
export const budgetBytes = 30 * 1024;

/** Folders that never hold a page a visitor loads. */
const SKIP_DIRS = new Set(["node_modules", ".git", ".tmp"]);

/** MIME types a browser runs as JavaScript. An absent type is a classic script. */
function isJavaScript(attrs: string): boolean {
  const type = attribute(attrs, "type");
  if (type === undefined) return true;
  const mime = type.trim().toLowerCase().split(";", 1)[0]!.trim();
  if (mime === "" || mime === "module") return true;
  return /^(?:text|application)\/(?:x-)?(?:java|ecma)script$/.test(mime) || mime === "text/jscript" || mime === "text/livescript";
}

/** A `<script>` element: its attributes and the text between the tags. */
export interface ScriptTag {
  readonly attrs: string;
  readonly body: string;
}

/** One script a page loads, with its compressed and raw sizes in bytes. */
export interface ScriptUse {
  /** Build-relative path, or `(inline)` for code written into the page. */
  readonly name: string;
  /** Brotli-compressed size. */
  readonly bytes: number;
  /** Size before compression. */
  readonly raw: number;
}

/** What one page loads. */
export interface PageBudget {
  /** Build-relative page path, with `/` separators. */
  readonly page: string;
  /** The compressed bytes of every distinct script the page loads. */
  readonly bytes: number;
  /** Scripts, largest first. */
  readonly scripts: readonly ScriptUse[];
  /** Problems that stopped the gate from measuring this page. */
  readonly problems: readonly string[];
}

/** What one build folder costs. */
export interface SiteBudget {
  /** Every HTML page, sorted by path. */
  readonly pages: readonly PageBudget[];
  /** Every page over the ceiling, largest first. */
  readonly over: readonly PageBudget[];
  /** Problems across the site, prefixed with the page that has them. */
  readonly problems: readonly string[];
}

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Brotli's best compression, the same stream a static host writes. */
export function compressedBytes(source: Buffer | string): number {
  const data = typeof source === "string" ? Buffer.from(source) : source;
  return brotliCompressSync(data, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
      [constants.BROTLI_PARAM_SIZE_HINT]: data.length,
    },
  }).length;
}

/** Reads an attribute from a tag's attribute text. Quotes are optional, as HTML allows. */
function attribute(attrs: string, name: string): string | undefined {
  const pattern = new RegExp(`(?:^|[\\s/])${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'\`=<>]+))`, "i");
  const match = pattern.exec(attrs);
  return match === null ? undefined : (match[1] ?? match[2] ?? match[3]);
}

/**
 * Every `<script>` element in `html`, in document order. Comments are skipped, and the closing tag is found
 * without matching a `</script>` inside the page's text.
 */
export function scriptTags(html: string): ScriptTag[] {
  const found: ScriptTag[] = [];
  const lower = html.toLowerCase();
  let index = 0;
  while (index < html.length) {
    const open = html.indexOf("<", index);
    if (open === -1) break;
    if (html.startsWith("<!--", open)) {
      const end = html.indexOf("-->", open + 4);
      index = end === -1 ? html.length : end + 3;
      continue;
    }
    const after = html[open + 7] ?? ">";
    if (lower.startsWith("<script", open) && /[\s/>]/.test(after)) {
      const gt = html.indexOf(">", open + 7);
      if (gt === -1) break;
      const attrs = html.slice(open + 7, gt);
      const close = lower.indexOf("</script", gt + 1);
      if (close === -1) {
        found.push({ attrs, body: html.slice(gt + 1) });
        break;
      }
      found.push({ attrs, body: html.slice(gt + 1, close) });
      const closeGt = html.indexOf(">", close);
      index = closeGt === -1 ? html.length : closeGt + 1;
      continue;
    }
    index = open + 1;
  }
  return found;
}

/**
 * The static module specifiers in `code`: `import "x"`, `import … from "x"`, and `export … from "x"`.
 * Dynamic `import("x")` and `import.meta` are not part of what a page loads up front, so they are ignored.
 */
export function importedSpecifiers(code: string): string[] {
  const found: string[] = [];
  const imports = /(?:^|[;{}\n])\s*import\s*(?!\s*[.(])(?:[^;'"`]*?\bfrom\s*)?(["'])([^"'\n]+)\1/g;
  const exports = /(?:^|[;{}\n])\s*export\s*(?:\*[^;'"`]*?|\{[^}]*\})\s*from\s*(["'])([^"'\n]+)\1/g;
  for (const match of code.matchAll(imports)) found.push(match[2]!);
  for (const match of code.matchAll(exports)) found.push(match[2]!);
  return found;
}

/** A URL with a scheme or a protocol-relative URL: the browser leaves the build folder to fetch it. */
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** A size cache shared by every page of one run, so a file is read and compressed once. */
interface Sizes {
  readonly files: Map<string, { bytes: number; raw: number; text: string }>;
  readonly inline: Map<string, number>;
}

function newSizes(): Sizes {
  return { files: new Map(), inline: new Map() };
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Turns a URL path into a file under `root`, or says why it cannot. */
function localFile(pathname: string, source: string, root: string): { file: string } | { problem: string } {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return { problem: `"${source}" has an invalid escape` };
  }
  if (!decoded.startsWith("/")) return { problem: `"${source}" is not an absolute path` };
  const file = resolve(root, "." + decoded);
  if (file !== root && !file.startsWith(root + sep)) return { problem: `"${source}" escapes the build folder` };
  if (!existsSync(file)) return { problem: `"${source}" is not in the build` };
  try {
    if (!statSync(file).isFile()) return { problem: `"${source}" is not a file` };
  } catch (err) {
    return { problem: `cannot read "${source}": ${message(err)}` };
  }
  return { file };
}

/** Resolves a `<script src>` against the page or module that loads it. */
function scriptFile(source: string, baseUrl: string, root: string): { file: string } | { problem: string } {
  if (EXTERNAL.test(source)) return { problem: `loads "${source}", which is outside the build` };
  let url: URL;
  try {
    url = new URL(source, `https://build.invalid${baseUrl}`);
  } catch {
    return { problem: `"${source}" is not a usable URL` };
  }
  if (url.origin !== "https://build.invalid") return { problem: `loads "${source}", which is outside the build` };
  return localFile(url.pathname, source, root);
}

/** Resolves a module specifier, which unlike `src` may not be a bare package name. */
function importedFile(specifier: string, importerUrl: string, root: string): { file: string } | { problem: string } {
  if (EXTERNAL.test(specifier)) return { problem: `imports "${specifier}", which is outside the build` };
  if (specifier.startsWith("#")) return { problem: `imports "${specifier}", which needs an import map the gate does not read` };
  if (!(specifier.startsWith("/") || specifier.startsWith("./") || specifier.startsWith("../"))) {
    return { problem: `imports the bare specifier "${specifier}", which a browser cannot resolve in the build` };
  }
  let url: URL;
  try {
    url = new URL(specifier, `https://build.invalid${importerUrl}`);
  } catch {
    return { problem: `"${specifier}" is not a usable module path` };
  }
  return localFile(url.pathname, specifier, root);
}

/** A build-relative path with `/` separators, the way HTML and URLs write it. */
function buildPath(file: string, root: string): string {
  return relative(root, file).split(sep).join("/");
}

/** Every HTML page under `dir`, sorted by path. */
function htmlFiles(dir: string): string[] {
  const found: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(current, entry.name));
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        found.push(join(current, entry.name));
      }
    }
  };
  walk(dir);
  return found.sort(byCodePoint);
}

/** Reads and compresses one script file once per run. */
function fileSize(file: string, sizes: Sizes): { bytes: number; raw: number; text: string } {
  const cached = sizes.files.get(file);
  if (cached !== undefined) return cached;
  const data = readFileSync(file);
  const entry = { bytes: compressedBytes(data), raw: data.length, text: data.toString("utf8") };
  sizes.files.set(file, entry);
  return entry;
}

/** Measures one page: its external scripts, its inline scripts, and the modules they import. */
export function pageBudget(file: string, root: string, sizes: Sizes = newSizes()): PageBudget {
  const page = buildPath(file, root);
  const pageUrl = `/${page}`;
  const problems: string[] = [];
  const uses = new Map<string, ScriptUse>();
  const inlineParts: string[] = [];
  const modules: { code: string; url: string }[] = [];
  const followed = new Set<string>();

  const add = (resolved: string, isModule: boolean): void => {
    const absolute = resolve(resolved);
    try {
      const size = fileSize(absolute, sizes);
      if (!uses.has(absolute)) uses.set(absolute, { name: buildPath(absolute, root), bytes: size.bytes, raw: size.raw });
      if (isModule && !followed.has(absolute)) {
        followed.add(absolute);
        modules.push({ code: size.text, url: `/${buildPath(absolute, root)}` });
      }
    } catch (err) {
      problems.push(`cannot read "${buildPath(absolute, root)}": ${message(err)}`);
    }
  };

  let html: string;
  try {
    html = readFileSync(file, "utf8");
  } catch (err) {
    return { page, bytes: 0, scripts: [], problems: [`cannot read the page: ${message(err)}`] };
  }

  for (const tag of scriptTags(html)) {
    if (!isJavaScript(tag.attrs)) continue;
    const type = attribute(tag.attrs, "type")?.trim().toLowerCase() ?? "";
    const isModule = type === "module" || type.startsWith("module;");
    const src = attribute(tag.attrs, "src");
    if (src !== undefined) {
      if (src.trim() === "") {
        problems.push(`has an empty script src`);
        continue;
      }
      const resolved = scriptFile(src, pageUrl, root);
      if ("problem" in resolved) problems.push(resolved.problem);
      else add(resolved.file, isModule);
      continue;
    }
    if (tag.body.trim() === "") continue;
    inlineParts.push(tag.body);
    if (isModule) modules.push({ code: tag.body, url: pageUrl });
  }

  if (inlineParts.length > 0) {
    const code = inlineParts.join("\n");
    let bytes = sizes.inline.get(code);
    if (bytes === undefined) {
      bytes = compressedBytes(code);
      sizes.inline.set(code, bytes);
    }
    uses.set("(inline)", { name: "(inline)", bytes, raw: Buffer.byteLength(code) });
  }

  // A module can import another module, so follow the graph instead of stopping at the page's tags.
  for (let index = 0; index < modules.length; index++) {
    const module = modules[index]!;
    for (const specifier of importedSpecifiers(module.code)) {
      const resolved = importedFile(specifier, module.url, root);
      if ("problem" in resolved) problems.push(resolved.problem);
      else add(resolved.file, true);
    }
  }

  const scripts = [...uses.values()].sort((a, b) => b.bytes - a.bytes || byCodePoint(a.name, b.name));
  const bytes = scripts.reduce((total, script) => total + script.bytes, 0);
  return { page, bytes, scripts, problems };
}

/** Measures every page in one engine build folder. */
export function budget(dir: string): SiteBudget {
  const root = resolve(dir);
  if (!existsSync(root)) return { pages: [], over: [], problems: [`${root} does not exist`] };
  if (!statSync(root).isDirectory()) return { pages: [], over: [], problems: [`${root} is not a directory`] };
  const sizes = newSizes();
  const pages = htmlFiles(root).map((file) => pageBudget(file, root, sizes));
  if (pages.length === 0) return { pages, over: [], problems: [`${root} has no HTML pages`] };
  const over = pages.filter((page) => page.bytes > budgetBytes).sort((a, b) => b.bytes - a.bytes || byCodePoint(a.page, b.page));
  const problems = pages.flatMap((page) => page.problems.map((problem) => `${page.page}: ${problem}`));
  return { pages, over, problems };
}

/** The largest script files in a build, with the number of pages that load each. */
function largestFiles(site: SiteBudget, limit = 5): { name: string; bytes: number; pages: number }[] {
  const files = new Map<string, { name: string; bytes: number; pages: number }>();
  for (const page of site.pages) {
    for (const script of page.scripts) {
      if (script.name === "(inline)") continue;
      const entry = files.get(script.name);
      if (entry === undefined) files.set(script.name, { name: script.name, bytes: script.bytes, pages: 1 });
      else {
        entry.pages += 1;
        if (script.bytes > entry.bytes) entry.bytes = script.bytes;
      }
    }
  }
  return [...files.values()].sort((a, b) => b.bytes - a.bytes || byCodePoint(a.name, b.name)).slice(0, limit);
}

/** Prints a build's result and says whether it passed. */
function report(label: string, site: SiteBudget): boolean {
  if (site.problems.length > 0) {
    console.error(`FAIL: JavaScript budget ${label}: ${site.problems.length} problem(s)`);
    for (const problem of site.problems) console.error(`  ${problem}`);
  }
  if (site.pages.length === 0) {
    console.error(`FAIL: JavaScript budget ${label}: no HTML pages`);
  } else if (site.over.length > 0) {
    console.error(`FAIL: JavaScript budget ${label}: ${site.over.length} of ${site.pages.length} page(s) over ${budgetBytes} bytes`);
    for (const page of site.over) {
      console.error(`  ${page.page} ${page.bytes} bytes`);
      for (const script of page.scripts.slice(0, 3)) console.error(`    ${script.name} ${script.bytes} bytes`);
    }
    const largest = largestFiles(site);
    if (largest.length > 0) {
      console.error("  Largest files:");
      for (const file of largest) console.error(`    ${file.name} ${file.bytes} bytes on ${file.pages} page(s)`);
    }
  }
  if (site.problems.length > 0 || site.pages.length === 0 || site.over.length > 0) return false;

  const largestPage = site.pages.reduce((largest, page) => (page.bytes > largest.bytes ? page : largest));
  const largest = largestFiles(site, 1)[0];
  const file = largest === undefined ? "none (inline scripts only)" : `${largest.name} ${largest.bytes} bytes`;
  console.log(`OK: JavaScript budget ${label} (${site.pages.length} pages, largest ${largestPage.page} ${largestPage.bytes} of ${budgetBytes} bytes; largest file ${file})`);
  return true;
}

/** Runs the gate on both fixtures, or on one build folder when one is given. */
export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const one = argv[0];
  if (one !== undefined) return report(one, budget(one)) ? 0 : 1;

  let passed = true;
  for (const name of FIXTURES as readonly FixtureName[]) {
    let dir: string;
    try {
      dir = await builtSite(name);
    } catch (err) {
      console.error(`FAIL: JavaScript budget ${name}: ${message(err)}`);
      return 1;
    }
    if (!report(name, budget(dir))) passed = false;
  }
  return passed ? 0 : 1;
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
