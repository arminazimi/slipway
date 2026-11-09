// Gate: every internal link and anchor in a built site resolves (quality.links, issue #1053).
//
//   node tools/links/run.ts            build both fixtures and check every HTML page
//   node tools/links/run.ts <build>    check one engine build folder
//
// The gate reads the engine's built HTML (through the shared fixture build, issue #1146), never a browser. It checks
// only links inside the build: external schemes, protocol-relative URLs, and absolute URLs that leave the site's
// `base` are skipped. A relative URL resolves the way a browser resolves it from the page URL; when that file is
// missing, it also resolves the way Markdown resolves it from the page's source file, because the engine does not
// rewrite source-relative Markdown links yet. A link to a missing page or a missing `#anchor` is an error, reported
// as `page -> href (target)`, and any error fails the gate.
//
// A redirect page (a meta refresh) is a valid target. A fragment on it is followed to the destination when the
// destination is in the build; a destination outside the build is accepted, because its anchors are not ours to
// check. Anchors on non-HTML files are errors.
import { readFile, readdir } from "node:fs/promises";
import { join, posix, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { builtSite, FIXTURES, type FixtureName } from "../fixture-build/build.ts";

/** The manifest the engine writes into a build, as far as this gate reads it. */
interface ManifestPage {
  readonly url?: unknown;
  readonly source?: unknown;
  readonly outputs?: unknown;
}

/** One source page and the files the build wrote for it. */
interface SourceEntry {
  readonly source: string;
  readonly html?: string;
  readonly md?: string;
}

/** A built site: every file, every HTML page, and the URL and source page each HTML file came from. */
export interface Site {
  /** The build folder the site was read from. */
  readonly dir: string;
  /** Every file in the build, as a forward-slash path relative to `dir`. */
  readonly files: ReadonlySet<string>;
  /** Every HTML page, keyed by its forward-slash path relative to `dir`, in path order. */
  readonly pages: ReadonlyMap<string, string>;
  /** The output URL of every HTML page, including the site `base`. */
  readonly urls: ReadonlyMap<string, string>;
  /** The source file of every page the manifest lists. */
  readonly sourceOf: ReadonlyMap<string, string>;
  /** Source file to its HTML and Markdown twin outputs. */
  readonly sources: ReadonlyMap<string, SourceEntry>;
  /** The site `base`, without a trailing slash, or `""` at a domain root. */
  readonly base: string;
}

/** One broken link. */
export interface Finding {
  /** Build-relative path of the page with the link, with forward slashes. */
  readonly page: string;
  /** The link as the page writes it. */
  readonly href: string;
  /** The build path the link names, with a leading `/`. */
  readonly target: string;
  /** What is wrong, in one line. */
  readonly message: string;
}

/** What one build's check found. */
export interface Report {
  /** HTML pages read. */
  readonly pages: number;
  /** Internal links checked. External links and ignored fragments do not count. */
  readonly links: number;
  /** Every broken link, in page and document order. */
  readonly findings: readonly Finding[];
}

/** Where the engine writes its manifest, relative to the output folder. */
const MANIFEST = ".slipway/manifest.json";

/** A scheme (`https:`, `mailto:`) or a protocol-relative URL, which leaves the build. */
const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** An opening tag with its attributes, keeping quoted `>` inside an attribute. */
const TAG = /<([a-zA-Z][a-zA-Z0-9:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

/** Elements whose body is code, not markup, so a `<a>` or `id` in a script string is not a page link or anchor. */
const CODE_ELEMENT = /<(script|style)\b[\s\S]*?<\/\1[^>]*>/gi;

/** Named entities built HTML carries. Numeric entities are decoded by code point. */
const ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: "\u00a0",
  quot: '"',
};

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The markup of a page: comments and script/style bodies removed, so only real links and anchors remain. */
function markupOf(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(CODE_ELEMENT, "");
}

/** Reads one attribute from a tag's attribute text. Quotes are optional, as HTML allows. */
function attribute(attrs: string, name: string): string | undefined {
  const pattern = new RegExp(`(?:^|[\\s/])${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'\`=<>]+))`, "i");
  const match = pattern.exec(attrs);
  return match === null ? undefined : (match[1] ?? match[2] ?? match[3]);
}

/** One code point as text, or the entity as written when it is out of range. */
function fromCodePoint(value: number, whole: string): string {
  try {
    return String.fromCodePoint(value);
  } catch {
    return whole;
  }
}

/** Decodes the entities built HTML carries, leaving an unknown or malformed one as written. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (whole, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith("#x")) return fromCodePoint(Number.parseInt(lower.slice(2), 16), whole);
    if (lower.startsWith("#")) return fromCodePoint(Number.parseInt(lower.slice(1), 10), whole);
    return ENTITIES[lower] ?? whole;
  });
}

/** Every `href` of an `<a>` in a page, in document order, with entities decoded. */
export function hrefsOf(html: string): string[] {
  const found: string[] = [];
  for (const match of markupOf(html).matchAll(TAG)) {
    if (match[1]?.toLowerCase() !== "a") continue;
    const href = attribute(match[2] ?? "", "href");
    if (href !== undefined) found.push(decodeEntities(href));
  }
  return found;
}

/** Every anchor name on a page: every `id`, plus the old-style `<a name>`. */
export function anchorsOf(html: string): Set<string> {
  const found = new Set<string>();
  for (const match of markupOf(html).matchAll(TAG)) {
    const attrs = match[2] ?? "";
    const id = attribute(attrs, "id");
    if (id !== undefined) found.add(decodeEntities(id));
    if (match[1]?.toLowerCase() === "a") {
      const name = attribute(attrs, "name");
      if (name !== undefined) found.add(decodeEntities(name));
    }
  }
  return found;
}

/** Whether `anchor` names an `id` or a named anchor on the page. */
export function hasAnchor(html: string, anchor: string): boolean {
  return anchorsOf(html).has(anchor);
}

/** The URL a redirect page (a meta refresh) sends a browser to, or `undefined` when it is not one. */
export function redirectOf(html: string): string | undefined {
  for (const match of markupOf(html).matchAll(TAG)) {
    if (match[1]?.toLowerCase() !== "meta") continue;
    const attrs = match[2] ?? "";
    if ((attribute(attrs, "http-equiv") ?? "").trim().toLowerCase() !== "refresh") continue;
    const content = attribute(attrs, "content");
    if (content === undefined) continue;
    const url = /url\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s;]+))/i.exec(content);
    const value = url?.[1] ?? url?.[2] ?? url?.[3];
    if (value !== undefined) return decodeEntities(value.trim());
  }
  return undefined;
}

/** The URL path of a page, so a relative href can be resolved against it: `install/index.html` is `/install/`. */
export function urlOf(page: string): string {
  if (page === "index.html") return "/";
  return `/${page.replace(/(?:^|\/)index\.html$/i, "/").replace(/\/+$/, "/")}`;
}

/** The path a page writes, written as the URL suffix it stands for: `install/index.html` is `/install/`. */
function prettySuffix(file: string): string {
  if (file === "index.html") return "/";
  if (file.endsWith("/index.html")) return `/${file.slice(0, -"index.html".length)}`;
  return `/${file}`;
}

/** The site `base` the manifest's page URLs carry, derived from a URL and the file it writes. */
function deriveBase(pairs: readonly { url: string; html: string }[]): string {
  const candidates = new Set<string>();
  for (const pair of pairs) {
    const suffix = prettySuffix(pair.html);
    if (pair.url.endsWith(suffix)) candidates.add(pair.url.slice(0, pair.url.length - suffix.length));
  }
  const found = [...candidates].sort(byCodePoint);
  return found.length === 1 ? found[0]! : "";
}

/** Every file under `dir`, as a forward-slash path relative to it, sorted by path. */
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

/** The manifest's pages, or none when the build has no manifest. */
async function manifestPages(dir: string): Promise<ManifestPage[]> {
  try {
    const raw = JSON.parse(await readFile(join(dir, MANIFEST), "utf8")) as { pages?: unknown };
    return Array.isArray(raw.pages) ? (raw.pages as ManifestPage[]) : [];
  } catch {
    return [];
  }
}

/** Reads a built site: every file, every HTML page, and the URL and source of each page. */
export async function readSite(dir: string): Promise<Site> {
  const files = new Set(await filesUnder(dir));
  const htmlFiles = [...files].filter((file) => file.endsWith(".html"));
  const urls = new Map<string, string>();
  const sourceOf = new Map<string, string>();
  const sources = new Map<string, SourceEntry>();
  const pairs: { url: string; html: string }[] = [];

  for (const page of await manifestPages(dir)) {
    if (typeof page.source !== "string") continue;
    const source = page.source.replace(/\\/g, "/");
    const outputs = Array.isArray(page.outputs) ? page.outputs.filter((output): output is string => typeof output === "string") : [];
    const html = outputs.find((output) => output.endsWith(".html"));
    const md = outputs.find((output) => output.endsWith(".md"));
    const entry: SourceEntry = { source, ...(html === undefined ? {} : { html }), ...(md === undefined ? {} : { md }) };
    sources.set(source, entry);
    if (html !== undefined) {
      sourceOf.set(html, source);
      if (typeof page.url === "string") {
        urls.set(html, page.url);
        pairs.push({ url: page.url, html });
      }
    }
  }

  const base = deriveBase(pairs);
  const pages = new Map<string, string>();
  await Promise.all(
    htmlFiles.map(async (page) => {
      try {
        pages.set(page, await readFile(join(dir, page), "utf8"));
      } catch {
        // A file that vanishes between listing and reading is not a page this run can check.
      }
    }),
  );
  for (const page of pages.keys()) {
    if (!urls.has(page)) urls.set(page, `${base}${urlOf(page)}`);
  }

  return {
    dir,
    files,
    pages: new Map([...pages].sort(([a], [b]) => byCodePoint(a, b))),
    urls,
    sourceOf,
    sources,
    base,
  };
}

/** One link resolved against the page: the build path, its anchor, and how the page wrote it. */
interface Target {
  /** The path portion as the page wrote it, decoded, before URL resolution. */
  readonly rawPath: string;
  /** The build-relative path the URL names, without a leading `/`. */
  readonly path: string;
  /** The decoded fragment, or `""` when the link has none. */
  readonly anchor: string;
  /** True when the path is root-absolute (`/guide/`) rather than relative to the page. */
  readonly absolute: boolean;
}

/** Decodes a URL path, leaving a malformed escape literal so the file check reports it. */
function decodePath(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/** Decodes a fragment, which may name a non-ASCII `id`, leaving a malformed escape literal. */
function decodeFragment(fragment: string): string {
  return decodePath(decodeEntities(fragment));
}

/**
 * Resolves a href against a page and the site base. Returns `undefined` for an external URL, a URL outside the
 * build's `base`, or an empty href, all of which the gate skips.
 */
export function targetOf(site: Site, page: string, href: string): Target | undefined {
  const value = decodeEntities(href.trim());
  if (value === "" || value === "#") return undefined;
  if (EXTERNAL.test(value)) return undefined;

  const rawPath = decodePath(value.split(/[?#]/, 1)[0] ?? "");
  const hash = value.indexOf("#");
  const anchor = hash === -1 ? "" : decodeFragment(value.slice(hash + 1));

  let url: URL;
  try {
    url = new URL(value, `https://build.invalid${site.urls.get(page) ?? "/"}`);
  } catch {
    return { rawPath, path: rawPath.replace(/^\/+/, ""), anchor, absolute: rawPath.startsWith("/") };
  }
  if (url.origin !== "https://build.invalid") return undefined;

  let path = decodePath(url.pathname);
  if (site.base !== "") {
    if (path === site.base) path = "/";
    else if (path.startsWith(`${site.base}/`)) path = path.slice(site.base.length);
    else return undefined;
  }
  return { rawPath, path: path.replace(/^\/+/, ""), anchor, absolute: rawPath.startsWith("/") };
}

/** The files a build path names: a folder is its `index.html`, and a path with an extension is exact. */
function existingFiles(site: Site, path: string): string[] {
  const clean = path.replace(/^\/+/, "");
  if (clean.split("/").includes("..")) return [];
  const candidates =
    clean === "" ? ["index.html"] : clean.endsWith("/") ? [`${clean}index.html`] : [clean, `${clean}/index.html`];
  return candidates.filter((candidate) => candidate !== "" && site.files.has(candidate));
}

/**
 * The files a relative href names when it is resolved from the page's source file instead of its URL. Markdown
 * links are source-relative (`../reference/doctor.md` from `rules/x.md`), while the built page sits at
 * `/rules/x/`, so the browser and the author disagree until the engine rewrites links. A source `.md` link maps
 * to the page's Markdown twin, and a source folder maps to its `index.html`.
 */
function sourceFiles(site: Site, page: string, rawPath: string, anchor: string): string[] {
  const source = site.sourceOf.get(page);
  if (source === undefined || rawPath === "") return [];
  const dir = posix.dirname(source);
  let clean = posix.normalize(posix.join(dir === "." ? "" : dir, rawPath)).replace(/^\.\//, "").replace(/^\/+/, "");
  if (clean === ".") clean = "";
  if (clean === ".." || clean.startsWith("../")) return [];

  const entry = site.sources.get(clean);
  if (entry !== undefined) {
    const file = anchor === "" ? (entry.md ?? entry.html) : entry.html;
    return file === undefined ? [] : [file];
  }
  const folder = clean.replace(/\/+$/, "");
  const index = site.sources.get(folder === "" ? "index.md" : `${folder}/index.md`);
  if ((clean === "" || clean.endsWith("/")) && index?.html !== undefined) return [index.html];
  return existingFiles(site, clean);
}

/** The result of checking one file for an anchor. */
interface AnchorResult {
  readonly ok: boolean;
  readonly message?: string;
}

/** A failure with its one-line reason. */
function fail(message: string): AnchorResult {
  return { ok: false, message };
}

/**
 * Whether `file` has `anchor`, following a redirect page (meta refresh) when it does not. A redirect to an
 * external URL is accepted because the gate does not read external pages. A cycle is an error.
 */
function anchorResult(
  site: Site,
  file: string,
  anchor: string,
  seen: Set<string>,
  cache: Map<string, Set<string>>,
): AnchorResult {
  const key = `${file}#${anchor}`;
  if (seen.has(key)) return fail(`has a redirect loop at ${file}#${anchor}`);
  seen.add(key);

  const html = site.pages.get(file);
  if (html === undefined) return fail(`names an anchor, but ${file} is not an HTML page`);

  let anchors = cache.get(file);
  if (anchors === undefined) {
    anchors = anchorsOf(html);
    cache.set(file, anchors);
  }
  if (anchors.has(anchor)) return { ok: true };

  const redirect = redirectOf(html);
  if (redirect === undefined) return fail(`names no anchor on ${file}`);

  const next = targetOf(site, file, redirect);
  if (next === undefined) return { ok: true };

  let nextFiles = existingFiles(site, next.path);
  if (nextFiles.length === 0 && !next.absolute) nextFiles = sourceFiles(site, file, next.rawPath, next.anchor);
  if (nextFiles.length === 0) return fail(`redirects to ${redirect}, which names no file in the build`);
  if (next.anchor === "") return fail(`redirects to ${redirect} without the anchor #${anchor}`);

  for (const candidate of nextFiles) {
    const result = anchorResult(site, candidate, next.anchor, seen, cache);
    if (result.ok) return result;
  }
  return fail(`redirects to ${redirect}, which names no anchor #${anchor}`);
}

/** Checks one href on one page. `null` means the link was skipped; `undefined` means it resolves. */
export function checkLink(site: Site, page: string, href: string, cache = new Map<string, Set<string>>()): Finding | null | undefined {
  const target = targetOf(site, page, href);
  if (target === undefined) return null;

  const shown = target.path === "" ? "/" : `/${target.path}`;
  let files = existingFiles(site, target.path);
  if (files.length === 0 && !target.absolute) files = sourceFiles(site, page, target.rawPath, target.anchor);
  if (files.length === 0) return { page, href, target: shown, message: "names no file in the build" };
  if (target.anchor === "") return undefined;

  let message = `names no anchor on ${files[0]}`;
  for (const file of files) {
    const result = anchorResult(site, file, target.anchor, new Set(), cache);
    if (result.ok) return undefined;
    message = result.message ?? message;
  }
  return { page, href, target: shown, message };
}

/** Checks every internal link and anchor of a built site, in page and document order. */
export async function auditSite(dir: string): Promise<Report> {
  const site = await readSite(dir);
  const cache = new Map<string, Set<string>>();
  const findings: Finding[] = [];
  let links = 0;
  for (const [page, html] of site.pages) {
    for (const href of hrefsOf(html)) {
      const finding = checkLink(site, page, href, cache);
      if (finding === null) continue;
      links += 1;
      if (finding !== undefined) findings.push(finding);
    }
  }
  return { pages: site.pages.size, links, findings };
}

/** Formats one finding as `page -> href (target): message`. */
export function formatFinding(fixture: string, finding: Finding): string {
  return `${fixture}: ${finding.page} -> ${finding.href} (${finding.target}): ${finding.message}`;
}

/** Reports one build and returns true when it passed. */
function report(label: string, result: Report): boolean {
  if (result.findings.length === 0) {
    console.log(`OK: links ${label} (${result.pages} pages, ${result.links} internal links)`);
    return true;
  }
  console.error(`FAIL: links ${label}: ${result.findings.length} broken internal link(s) in ${result.pages} pages`);
  for (const finding of result.findings) console.error(`  ${formatFinding(label, finding)}`);
  return false;
}

/** Builds each fixture, or checks one build folder when one is given, and returns 0 when every link resolves. */
export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const one = argv[0];
  if (one !== undefined) return report(one, await auditSite(one)) ? 0 : 1;

  let passed = true;
  for (const name of FIXTURES as readonly FixtureName[]) {
    let dir: string;
    try {
      dir = await builtSite(name);
    } catch (err) {
      console.error(`FAIL: links ${name}: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
    if (!report(name, await auditSite(dir))) passed = false;
  }
  return passed ? 0 : 1;
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
