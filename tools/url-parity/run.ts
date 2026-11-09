// URL parity gate (evergreen.url-parity, issue #1185): every URL an old sitemap lists still exists in a new build, or
// a redirect page covers it.
//
//   node tools/url-parity/run.ts
//       Build examples/product-docs and compare it with the sitemap its own build writes.
//   node tools/url-parity/run.ts --old <file|url> --new <dir|fixture|site>
//   node tools/url-parity/run.ts [--base <path>] <old> <new>
//   node tools/url-parity/run.ts --new <dir|fixture|site>
//       Compare a build with its own sitemap.
//
// The old sitemap is a local XML file or an `http(s)` URL; that is the only network this gate uses. The new side is an
// output folder, a fixture name (`docs-site`, `rtl-site`), or a site folder the engine builds into a temporary folder.
//
// Both sides are normalized before comparing: the absolute URL becomes its path, the query and fragment go, the site
// `base` is stripped, `index.html` and a trailing slash name the same folder, and a legacy `.html` URL (`/old.html`)
// names the pretty URL the engine writes for the same page (`/old/`). A redirect page (a meta refresh) covers its own
// URL, and the target it names is covered too, so an old sitemap that lists both sides of a move passes.
//
// The build's manifest says which HTML files are pages; an HTML file outside the manifest is an app page or another
// site file, not a page URL. Redirect pages are read from the build even when the manifest does not list them. A
// missing old URL prints `old -> (missing)` and exits 1; the summary counts checked, covered, redirected, and missing.
import { readFile, readdir, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "../../packages/engine/src/pipeline/build.ts";
import { builtSite, FIXTURES, root, type FixtureName } from "../fixture-build/build.ts";

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** One line of a failure, without a stack trace. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** A code point as text, or the entity as written when it is out of range. */
function fromCodePoint(value: number, whole: string): string {
  try {
    return String.fromCodePoint(value);
  } catch {
    return whole;
  }
}

/** Decodes the XML entities a sitemap can carry, leaving an unknown one as written. */
function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (whole, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower === "amp") return "&";
    if (lower === "lt") return "<";
    if (lower === "gt") return ">";
    if (lower === "quot") return '"';
    if (lower === "apos") return "'";
    if (lower.startsWith("#x")) return fromCodePoint(Number.parseInt(lower.slice(2), 16), whole);
    return fromCodePoint(Number.parseInt(lower.slice(1), 10), whole);
  });
}

/** Decodes one URL path segment, leaving a malformed escape literal. */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Decodes every segment of a URL path, so `%20` and a space compare equal. */
function decodePath(path: string): string {
  return path.split("/").map(decodeSegment).join("/");
}

/** The site `base` as a path without a trailing slash: `/docs/`, `/docs`, and an absolute URL all mean `/docs`. */
export function normalizeBase(base: string | undefined): string {
  if (base === undefined) return "";
  const trimmed = base.trim();
  if (trimmed === "" || trimmed === "/") return "";
  let value = trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) {
    try {
      value = new URL(value, "https://url-parity.invalid").pathname;
    } catch {
      return "";
    }
  } else {
    value = value.split(/[?#]/, 1)[0] ?? "";
  }
  value = decodePath(value).replace(/\\/g, "/");
  if (!value.startsWith("/")) value = `/${value}`;
  value = value.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
  return value;
}

/** What normalization needs to know about the site. */
export interface NormalizeOptions {
  /** The site `base`, such as `/docs`; every absolute URL is reduced to the path under it. */
  readonly base?: string;
}

/**
 * The comparable path of a URL from either side, or `undefined` for a value that is not a site path. An absolute or
 * protocol-relative URL becomes its path; a relative path keeps its shape. The query and fragment go, the site `base`
 * goes, and `index.html`, a legacy `.html` extension, and a trailing slash all name the same folder.
 */
export function normalizeUrl(value: string, options: NormalizeOptions = {}): string | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;

  let pathname: string;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    if (!/^https?:/i.test(trimmed)) return undefined;
    try {
      pathname = new URL(trimmed).pathname;
    } catch {
      return undefined;
    }
  } else if (trimmed.startsWith("//")) {
    try {
      pathname = new URL(`https:${trimmed}`).pathname;
    } catch {
      return undefined;
    }
  } else {
    pathname = trimmed.split(/[?#]/, 1)[0] ?? "";
  }

  pathname = decodePath(pathname).replace(/\\/g, "/");
  if (pathname === "") pathname = "/";
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  pathname = pathname.replace(/\/{2,}/g, "/");

  const base = normalizeBase(options.base);
  if (base !== "" && (pathname === base || pathname.startsWith(`${base}/`))) {
    pathname = pathname.slice(base.length) || "/";
  }

  const index = /\/index\.html?$/i.exec(pathname);
  if (index !== null) {
    pathname = pathname.slice(0, index.index + 1) || "/";
  } else if (/\.html?$/i.test(pathname)) {
    pathname = `${pathname.replace(/\.html?$/i, "")}/`;
  }

  if (pathname !== "/" && !pathname.endsWith("/")) {
    const last = pathname.slice(pathname.lastIndexOf("/") + 1);
    if (!last.includes(".")) pathname += "/";
  }
  return pathname;
}

/** The result of reading an old sitemap. `error` is set when the text is not a URL list, never thrown. */
export interface ParsedSitemap {
  readonly urls: readonly string[];
  readonly error?: string;
}

/**
 * Reads the `<loc>` entries of a sitemap. A sitemap index, a missing `<urlset>`, an unbalanced tag, and an empty
 * `<loc>` are reported as `error`, so a broken input fails the gate without an exception.
 */
export function parseSitemap(xml: string): ParsedSitemap {
  const text = xml.replace(/^\uFEFF/, "").replace(/<!--[\s\S]*?-->/g, "");
  if (/<sitemapindex\b/i.test(text) && !/<urlset\b/i.test(text)) {
    return { urls: [], error: "sitemap index files are not supported; give the sitemap itself" };
  }
  if (!/<urlset\b/i.test(text)) return { urls: [], error: "not a sitemap: no <urlset> element" };
  if (!/<\/urlset\s*>/i.test(text)) return { urls: [], error: "malformed sitemap: <urlset> is not closed" };

  const urlsOpen = (text.match(/<url\b/gi) ?? []).length;
  const urlsClose = (text.match(/<\/url\s*>/gi) ?? []).length;
  if (urlsOpen !== urlsClose) {
    return { urls: [], error: `malformed sitemap: ${urlsOpen} <url> start tag(s) and ${urlsClose} end tag(s)` };
  }

  const locsOpen = (text.match(/<loc\b/gi) ?? []).length;
  const locsClose = (text.match(/<\/loc\s*>/gi) ?? []).length;
  if (locsOpen !== locsClose) {
    return { urls: [], error: `malformed sitemap: ${locsOpen} <loc> start tag(s) and ${locsClose} end tag(s)` };
  }
  if (locsOpen === 0) return { urls: [], error: "the sitemap lists no <loc> entries" };

  const urls: string[] = [];
  for (const match of text.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc\s*>/gi)) {
    const loc = decodeXml(match[1] ?? "").trim();
    if (loc === "") return { urls: [], error: "the sitemap has an empty <loc>" };
    urls.push(loc);
  }
  if (urls.length !== locsOpen) {
    return { urls: [], error: `malformed sitemap: read ${urls.length} of ${locsOpen} <loc> entries` };
  }
  return { urls };
}

/** Reads one attribute from a tag's attribute text. Quotes are optional, as HTML allows. */
function attribute(attrs: string, name: string): string | undefined {
  const pattern = new RegExp(`(?:^|[\\s/])${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'\`=<>]+))`, "i");
  const match = pattern.exec(attrs);
  return match === null ? undefined : (match[1] ?? match[2] ?? match[3]);
}

/**
 * The targets a redirect page names, or `undefined` when the page has no meta refresh. The refresh target comes
 * first; a canonical link is added when it differs. Only a page with a meta refresh is a redirect: every generated
 * page carries a canonical link, and a canonical link alone is not a redirect.
 */
export function redirectTargets(html: string): string[] | undefined {
  const markup = html.replace(/<!--[\s\S]*?-->/g, "");
  const tag = /<([a-zA-Z][a-zA-Z0-9:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

  let refresh: string | undefined;
  for (const match of markup.matchAll(tag)) {
    if (match[1]?.toLowerCase() !== "meta") continue;
    const attrs = match[2] ?? "";
    if ((attribute(attrs, "http-equiv") ?? "").trim().toLowerCase() !== "refresh") continue;
    const content = attribute(attrs, "content");
    if (content === undefined) continue;
    const url = /url\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s;]+))/i.exec(content);
    const value = url?.[1] ?? url?.[2] ?? url?.[3];
    if (value !== undefined) {
      refresh = decodeXml(value.trim());
      break;
    }
  }
  if (refresh === undefined) return undefined;

  const targets = [refresh];
  for (const match of markup.matchAll(tag)) {
    if (match[1]?.toLowerCase() !== "link") continue;
    const attrs = match[2] ?? "";
    if ((attribute(attrs, "rel") ?? "").trim().toLowerCase() !== "canonical") continue;
    const href = attribute(attrs, "href");
    if (href === undefined) continue;
    const target = decodeXml(href.trim());
    if (!targets.includes(target)) targets.push(target);
  }
  return targets;
}

/** The origin of an absolute `http(s)` URL, or `undefined` for a relative URL or another scheme. */
function originOf(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : undefined;
  } catch {
    return undefined;
  }
}

/** One target a redirect page names, normalized to a site path. */
export interface RedirectTarget {
  readonly path: string;
  /** The target's origin when it is an absolute URL; `undefined` for a site-relative target. */
  readonly origin?: string;
}

/** One redirect page in the new build. */
export interface RedirectEntry {
  /** The page's own URL, normalized. */
  readonly from: string;
  /** The targets it names, normalized; the meta refresh target first. */
  readonly targets: readonly RedirectTarget[];
}

/** A new build, as this gate reads it. */
export interface Build {
  /** The build folder. */
  readonly dir: string;
  /** The site `base` derived from the manifest, or `""`. */
  readonly base: string;
  /** Every page URL, normalized. Redirect pages are not pages. */
  readonly pages: ReadonlySet<string>;
  /** Every redirect page, keyed by its normalized old URL. */
  readonly redirects: ReadonlyMap<string, RedirectEntry>;
  /** Every file in the build, as a forward-slash path relative to the build folder. */
  readonly files: ReadonlySet<string>;
}

/** One manifest page, as far as this gate reads it. */
interface ManifestPage {
  readonly url?: unknown;
  readonly outputs?: unknown;
}

/** Every file under `dir`, as a forward-slash path relative to it, sorted by code point. */
async function filesUnder(dir: string): Promise<string[]> {
  const found: string[] = [];
  async function walk(current: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) found.push(relative(dir, path).split(sep).join("/"));
    }
  }
  await walk(dir);
  return found.sort(byCodePoint);
}

/** The manifest's pages, or `undefined` when the build has no readable manifest. */
async function manifestPages(dir: string): Promise<ManifestPage[] | undefined> {
  try {
    const raw = JSON.parse(await readFile(join(dir, ".slipway/manifest.json"), "utf8")) as { pages?: unknown };
    if (!Array.isArray(raw.pages)) return undefined;
    return raw.pages.filter((page): page is ManifestPage => typeof page === "object" && page !== null);
  } catch {
    return undefined;
  }
}

/** The URL suffix a built file stands for: `index.html` is `/`, `a/index.html` is `/a/`, `a.html` is `/a.html`. */
function prettySuffix(file: string): string {
  if (file === "index.html") return "/";
  if (file.endsWith("/index.html")) return `/${file.slice(0, -"index.html".length)}`;
  return `/${file}`;
}

/** The site `base` a manifest's page URLs carry, when exactly one base explains every page. */
function deriveBase(pairs: readonly { readonly url: string; readonly html: string }[]): string {
  const candidates = new Set<string>();
  for (const pair of pairs) {
    const suffix = prettySuffix(pair.html);
    if (pair.url.endsWith(suffix)) candidates.add(pair.url.slice(0, pair.url.length - suffix.length));
  }
  return candidates.size === 1 ? normalizeBase([...candidates][0]) : "";
}

/**
 * Reads a build: every page URL the manifest lists, every redirect page in the folder, and the site `base`. An HTML
 * file outside the manifest is an app page or another site file, not a page URL. A build with no manifest has no page
 * list to trust, so every HTML file that is not a redirect page is a page.
 */
export async function readBuild(dir: string): Promise<Build> {
  const files = new Set(await filesUnder(dir));
  const manifest = await manifestPages(dir);

  const pageFiles = new Set<string>();
  const pairs: { url: string; html: string }[] = [];
  if (manifest !== undefined) {
    for (const page of manifest) {
      if (typeof page.url !== "string") continue;
      const outputs = Array.isArray(page.outputs)
        ? page.outputs.filter((output): output is string => typeof output === "string")
        : [];
      const html = outputs.find((output) => /\.html?$/i.test(output));
      if (html === undefined || !files.has(html)) continue;
      pageFiles.add(html);
      pairs.push({ url: page.url, html });
    }
  }
  const base = deriveBase(pairs);

  const pages = new Set<string>();
  const redirects = new Map<string, RedirectEntry>();
  for (const file of [...files].filter((file) => /\.html?$/i.test(file)).sort(byCodePoint)) {
    let html: string;
    try {
      html = await readFile(join(dir, file), "utf8");
    } catch {
      continue;
    }

    if (!pageFiles.has(file)) {
      const targets = redirectTargets(html);
      if (targets !== undefined) {
        const from = normalizeUrl(`/${file}`);
        if (from !== undefined) {
          const normalized = targets
            .map((target): RedirectTarget | undefined => {
              const path = normalizeUrl(target, { base });
              if (path === undefined) return undefined;
              const origin = originOf(target);
              return origin === undefined ? { path } : { path, origin };
            })
            .filter((target): target is RedirectTarget => target !== undefined);
          redirects.set(from, { from, targets: normalized });
          continue;
        }
      }
    }

    if (manifest !== undefined && !pageFiles.has(file)) continue;
    const url = normalizeUrl(`/${file}`);
    if (url !== undefined) pages.add(url);
  }

  return { dir, base, pages, redirects, files };
}

/** One old sitemap URL: the value as the sitemap wrote it, and its comparable path. */
export interface OldUrl {
  readonly original: string;
  readonly normalized: string;
}

/** Normalizes the sitemap's URLs, drops duplicates, and sorts them by path (ADR 0022, rule 5). */
export function oldUrls(urls: readonly string[], base = ""): OldUrl[] {
  const seen = new Map<string, OldUrl>();
  for (const url of urls) {
    const normalized = normalizeUrl(url, { base });
    if (normalized === undefined) continue;
    const original = url.trim();
    const existing = seen.get(normalized);
    if (existing === undefined || byCodePoint(original, existing.original) < 0) {
      seen.set(normalized, { original, normalized });
    }
  }
  return [...seen.values()].sort((a, b) => byCodePoint(a.normalized, b.normalized) || byCodePoint(a.original, b.original));
}

/** One old URL with no page and no redirect. */
export interface Missing {
  readonly old: string;
  readonly normalized: string;
}

/** What comparing an old sitemap with a build found. */
export interface Report {
  /** Normalized old URLs read. */
  readonly checked: number;
  /** Old URLs a page or a redirect target covers. */
  readonly covered: number;
  /** Old URLs a redirect page's own address covers. */
  readonly redirected: number;
  /** Old URLs nothing covers, sorted by normalized path. */
  readonly missing: readonly Missing[];
}

/** The origin the old sitemap uses, so an absolute redirect to another host does not count as a site target. */
function oldOrigin(entries: readonly OldUrl[]): string | undefined {
  for (const entry of entries) {
    const origin = originOf(entry.original);
    if (origin !== undefined) return origin;
  }
  return undefined;
}

/**
 * Compares normalized old URLs with a build. A page covers its URL; a redirect page covers its own URL; and the
 * targets a redirect names cover theirs, so an old sitemap that lists the old and the new address passes. A target
 * on another origin is not a target in this build.
 */
export function compare(entries: readonly OldUrl[], build: Build): Report {
  const site = oldOrigin(entries);
  const targets = new Set<string>();
  for (const redirect of build.redirects.values()) {
    for (const target of redirect.targets) {
      if (target.origin === undefined || site === undefined || target.origin === site) targets.add(target.path);
    }
  }

  let covered = 0;
  let redirected = 0;
  const missing: Missing[] = [];
  for (const entry of entries) {
    if (build.pages.has(entry.normalized)) covered += 1;
    else if (build.redirects.has(entry.normalized)) redirected += 1;
    else if (targets.has(entry.normalized)) covered += 1;
    else missing.push({ old: entry.original, normalized: entry.normalized });
  }
  return { checked: entries.length, covered, redirected, missing };
}

/** An old sitemap's text and the name to report it by. */
export interface OldSitemap {
  readonly text: string;
  readonly label: string;
}

/** Reads the old sitemap from a local file, a `file:` URL, or an `http(s)` URL. No other scheme is fetched. */
export async function readOldSitemap(source: string): Promise<OldSitemap> {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
    return { text: await response.text(), label: source };
  }
  if (/^file:\/\//i.test(source)) return { text: await readFile(fileURLToPath(source), "utf8"), label: source };
  if (/^[a-z][a-z0-9+.-]*:/i.test(source)) throw new Error(`unsupported URL scheme in ${source}`);
  return { text: await readFile(resolve(source), "utf8"), label: source };
}

/** What {@link audit} needs. */
export interface AuditOptions {
  /** The old sitemap: a local file or an `http(s)` URL. */
  readonly old: string;
  /** The new build folder. */
  readonly new: string;
  /** The site `base`; the build's manifest supplies it when this is omitted. */
  readonly base?: string;
}

/** The outcome of an audit: a report, or an error the tool reports without throwing. */
export interface AuditResult {
  readonly report?: Report;
  readonly error?: string;
}

/** Reads both sides, normalizes the old URLs, and compares them. A broken sitemap becomes `error`, not a throw. */
export async function audit(options: AuditOptions): Promise<AuditResult> {
  let source: OldSitemap;
  try {
    source = await readOldSitemap(options.old);
  } catch (error) {
    return { error: `cannot read ${options.old}: ${messageOf(error)}` };
  }

  const parsed = parseSitemap(source.text);
  if (parsed.error !== undefined) return { error: `${source.label}: ${parsed.error}` };

  const build = await readBuild(options.new);
  const entries = oldUrls(parsed.urls, options.base ?? build.base);
  if (entries.length === 0) return { error: `${source.label}: no site URLs to compare` };
  return { report: compare(entries, build) };
}

/** A new side this run can read: a build folder, a fixture, or a site the engine builds into a temporary folder. */
interface NewTarget {
  readonly dir: string;
  readonly label: string;
  readonly cleanup?: () => Promise<void>;
}

/** True when `path` is a folder. */
async function isFolder(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

/** True when `path` is a file. */
async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/**
 * Builds a site folder into a temporary folder, returns its output, and removes the folder when the run ends. A build
 * error is thrown, never reported as an empty site.
 */
async function buildSite(path: string, label: string): Promise<NewTarget> {
  const scratch = await mkdtemp(join(tmpdir(), "url-parity-"));
  const out = join(scratch, "out");
  let result;
  try {
    result = await build({ root: path, out, themeRoot: join(root, "packages/theme"), defaultLayout: "doc" });
  } catch (error) {
    await rm(scratch, { recursive: true, force: true });
    throw error;
  }
  const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === "error");
  if (errors.length > 0) {
    await rm(scratch, { recursive: true, force: true });
    const lines = errors.map((diagnostic) => `  ${diagnostic.id}: ${diagnostic.message}`);
    throw new Error(`the site "${label}" has ${errors.length} build error(s):\n${lines.join("\n")}`);
  }
  return { dir: out, label, cleanup: () => rm(scratch, { recursive: true, force: true }) };
}

/**
 * Resolves the new side. With no argument it builds `examples/product-docs`, the site whose 0.2 sitemap this gate was
 * written for, and compares that build with its own sitemap. A fixture name builds through the shared fixture build. A
 * folder with a manifest is a build folder, even when it also carries a copy of `mizzen.yml`; a folder with
 * `mizzen.yml` and no manifest is a site the engine builds into a temporary folder.
 */
async function resolveNew(value: string | undefined): Promise<NewTarget> {
  if (value === undefined) return buildSite(join(root, "examples/product-docs"), "examples/product-docs");
  if ((FIXTURES as readonly string[]).includes(value)) {
    return { dir: await builtSite(value as FixtureName), label: value };
  }

  const path = resolve(value);
  if (!(await isFolder(path))) {
    throw new Error(`new side "${value}" is not a build folder, a fixture (${FIXTURES.join(", ")}), or a site folder`);
  }
  if (await isFile(join(path, ".slipway/manifest.json"))) return { dir: path, label: value };
  if (await isFile(join(path, "mizzen.yml"))) return buildSite(path, value);
  if (await isFile(join(path, "index.html"))) return { dir: path, label: value };
  throw new Error(`new side "${value}" is not a build folder (no .slipway/manifest.json or index.html), a fixture, or a site`);
}

/** The command line, before defaults. */
export interface CliOptions {
  readonly old?: string;
  readonly newTarget?: string;
  readonly base?: string;
  readonly help?: boolean;
  readonly error?: string;
}

/** Parses `--old`, `--new`, `--base`, `--help`, and the positional `<old> <new>` fallback. */
export function parseArgs(argv: readonly string[]): CliOptions {
  let old: string | undefined;
  let newTarget: string | undefined;
  let base: string | undefined;
  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (arg === "-h" || arg === "--help") return { help: true };
    if (arg === "--old") {
      const value = argv[index + 1];
      if (value === undefined) return { error: "--old needs a file or an http(s) URL" };
      old = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--old=")) {
      old = arg.slice("--old=".length);
      continue;
    }
    if (arg === "--new") {
      const value = argv[index + 1];
      if (value === undefined) return { error: "--new needs a build folder, a fixture, or a site folder" };
      newTarget = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--new=")) {
      newTarget = arg.slice("--new=".length);
      continue;
    }
    if (arg === "--base") {
      const value = argv[index + 1];
      if (value === undefined) return { error: "--base needs a path, such as /docs" };
      base = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--base=")) {
      base = arg.slice("--base=".length);
      continue;
    }
    if (arg.startsWith("-")) return { error: `unknown option ${arg}` };
    positional.push(arg);
  }

  if (old === undefined && newTarget === undefined) {
    if (positional.length > 2) return { error: "give one old sitemap and one new build, not more" };
    old = positional[0];
    newTarget = positional[1];
  } else if (old === undefined) {
    if (positional.length > 1) return { error: "give one old sitemap after --new" };
    old = positional[0];
  } else if (newTarget === undefined) {
    if (positional.length > 1) return { error: "give one new build after --old" };
    newTarget = positional[0];
  } else if (positional.length > 0) {
    return { error: "give the old sitemap and the new build either as options or as positional arguments, not both" };
  }

  return { old, newTarget, ...(base === undefined ? {} : { base }) };
}

/** The usage text: one line per accepted shape, then the options and the comparison rules. */
export const USAGE = [
  "Usage:",
  "  node tools/url-parity/run.ts",
  "      Build examples/product-docs and compare it with the sitemap its own build writes.",
  "  node tools/url-parity/run.ts --old <file|url> --new <dir|fixture|site>",
  "  node tools/url-parity/run.ts [--base <path>] <old> <new>",
  "  node tools/url-parity/run.ts --new <dir|fixture|site>",
  "      Compare a build with its own sitemap.",
  "",
  "Options:",
  "  --old <file|url>   The old sitemap: a local XML file or an http(s) URL.",
  "  --new <target>     A build folder, a fixture (docs-site, rtl-site), or a site folder to build.",
  "  --base <path>      The site base to strip from both sides, such as /docs.",
  "  -h, --help         Show this help.",
  "",
  "Old URLs are normalized before comparing: absolute URL to path, query and fragment dropped, site base",
  "stripped, trailing slash, index.html, and a legacy .html extension. A missing URL prints",
  "`old -> (missing)` and exits 1.",
].join("\n");

/** Prints the report and returns 0 when nothing is missing, 1 otherwise. */
function reportResult(label: string, report: Report): number {
  if (report.missing.length === 0) {
    console.log(`OK: url-parity ${label}`);
  } else {
    console.error(`FAIL: url-parity ${label}: ${report.missing.length} old URL(s) missing`);
    for (const item of report.missing) console.error(`  ${item.old} -> (missing)`);
  }
  console.log(`checked ${report.checked}, covered ${report.covered}, redirected ${report.redirected}, missing ${report.missing.length}`);
  return report.missing.length === 0 ? 0 : 1;
}

/** Runs the gate and returns its exit code: 0 when every old URL is covered, 1 for a finding or a bad input, 2 for usage. */
export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const options = parseArgs(argv);
  if (options.help === true) {
    console.log(USAGE);
    return 0;
  }
  if (options.error !== undefined) {
    console.error(`url-parity: ${options.error}\n\n${USAGE}`);
    return 2;
  }
  if (options.old !== undefined && options.old.trim() === "") {
    console.error(`url-parity: --old is empty\n\n${USAGE}`);
    return 2;
  }
  if (options.newTarget !== undefined && options.newTarget.trim() === "") {
    console.error(`url-parity: --new is empty\n\n${USAGE}`);
    return 2;
  }
  if (options.old !== undefined && options.newTarget === undefined) {
    console.error(`url-parity: --old needs a --new build (or give both as positional arguments)\n\n${USAGE}`);
    return 2;
  }

  let target: NewTarget | undefined;
  try {
    target = await resolveNew(options.newTarget);
    const old = options.old ?? join(target.dir, "sitemap.xml");
    const result = await audit({ old, new: target.dir, ...(options.base === undefined ? {} : { base: options.base }) });
    if (result.error !== undefined) {
      console.error(`FAIL: url-parity: ${result.error}`);
      return 1;
    }
    if (result.report === undefined) {
      console.error("FAIL: url-parity: no report");
      return 1;
    }
    return reportResult(target.label, result.report);
  } catch (error) {
    console.error(`FAIL: url-parity: ${messageOf(error)}`);
    return 1;
  } finally {
    await target?.cleanup?.();
  }
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
