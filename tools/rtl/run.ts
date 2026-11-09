// Right-to-left gate (issue #1159): a Persian page is a right-to-left page, the code in it is not, and the
// theme keeps both true.
//
//   node tools/rtl/run.ts                build fixtures/rtl-site and test it
//   node tools/rtl/run.ts --site <dir>   test an already built site instead (with `--lang`, default `fa`)
//   npm run check                        runs this with every other gate
//
// The gate checks four things:
//
//   direction   every page's `<html>` carries `dir="rtl"` and the config's language.
//   code        at least one page renders a code block, and `styles/rtl.css` keeps `pre`, `code`, and `kbd`
//               left to right (`direction: ltr`, `unicode-bidi: isolate`).
//   icons       every directional icon (an arrow, a chevron, a separator, or a rotated corner) has a mirror
//               mechanism: a `[dir="rtl"]` or `:dir(rtl)` transform, or logical properties only. Each one is
//               printed with where its mechanism lives.
//   logical     no physical CSS property in any theme stylesheet. The rule is `findPhysical` from
//               `tools/theme/logical-css.ts`, reused rather than copied.
//
// The fixture still names its config `slipway.yml`, and the engine reads `mizzen.yml`, so a direct build of
// `fixtures/rtl-site` comes out `lang="en" dir="ltr"` (`tools/visual/run.ts` documents the same gap). The gate
// therefore builds a temporary copy of the fixture with the config renamed to `mizzen.yml`; the fixture itself is
// untouched. Delete the copy step when the fixture is renamed (a follow-up, not this issue).
//
// The engine does not write the theme's stylesheets into a page yet (pre-existing), so the code and icon checks
// read the theme's CSS as shipped and the direction check reads the page's HTML. No computed style is faked, and
// no browser is needed.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { cp, mkdtemp, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadConfig } from "../../packages/engine/src/config/load.ts";
import { build } from "../../packages/engine/src/pipeline/build.ts";
import { findPhysical } from "../theme/logical-css.ts";

/** The repository root: this file sits three levels below it. */
export const root = join(fileURLToPath(import.meta.url), "../../..");

/** The fixture the gate builds. */
export const FIXTURE = "rtl-site" as const;

/** The fixture's old config name, which the engine no longer reads. */
export const OLD_CONFIG = "slipway.yml" as const;

/** The config name the engine reads (ADR 0025). */
export const CONFIG = "mizzen.yml" as const;

/** The layout the engine's CLI gives a page that names none. */
export const DEFAULT_LAYOUT = "doc" as const;

/** The language `--site` assumes when it is not told; the fixture is Persian. */
export const DEFAULT_LANG = "fa" as const;

/** One built page: its path inside the build and its HTML. */
export interface PageSource {
  /** The page's path relative to the build folder, with `/` separators. */
  readonly file: string;
  /** The page's HTML. */
  readonly html: string;
}

/** One stylesheet: its path relative to the repository and its CSS. */
export interface Stylesheet {
  /** The stylesheet's path, such as `packages/theme/styles/rtl.css`. */
  readonly file: string;
  /** The stylesheet's text. */
  readonly css: string;
}

/** Which check found a problem. */
export type CheckName = "direction" | "code" | "icons" | "logical";

/** One problem, in one check. */
export interface Finding {
  /** The check that found it. */
  readonly check: CheckName;
  /** What went wrong, in one line. */
  readonly message: string;
}

/** One directional icon and the mechanism that mirrors it. */
export interface IconRule {
  /** The stylesheet that draws the icon. */
  readonly file: string;
  /** The line the icon's base rule starts on. */
  readonly line: number;
  /** The icon's selector, such as `.pager-arrow`. */
  readonly selector: string;
  /** How it follows the reading direction: `mirror: …` or `logical: …`. */
  readonly mechanism: string;
}

/** The input of {@link analyze}: the built pages, the theme's stylesheets, and the expected language. */
export interface RtlInput {
  /** Every HTML page of the build. */
  readonly pages: readonly PageSource[];
  /** Every CSS file of the theme. */
  readonly stylesheets: readonly Stylesheet[];
  /** The config's language, such as `fa`. */
  readonly lang: string;
}

/** What one run found. */
export interface RtlResult {
  /** Every problem, in check order. */
  readonly findings: readonly Finding[];
  /** Things the gate could not cover directly, such as a build that links no stylesheet. */
  readonly notes: readonly string[];
  /** Every directional icon found, with its mechanism. */
  readonly icons: readonly IconRule[];
  /** The language the pages were checked against. */
  readonly lang: string;
  /** How many HTML pages the build has. */
  readonly pages: number;
  /** How many pages render a code block. */
  readonly codePages: number;
  /** How many theme stylesheets were read. */
  readonly stylesheets: number;
}

/** A rule of a stylesheet: its selector, its declarations, and the line it starts on. */
interface Rule {
  readonly selector: string;
  readonly body: string;
  readonly line: number;
}

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** A path as the messages show it: repository-relative when it is inside the repository. */
function displayPath(path: string): string {
  const relativePath = relative(root, path);
  return relativePath.startsWith("..") ? path : relativePath.split(sep).join("/");
}

/** Every file under `dir` whose name ends with `extension`, sorted. */
function filesUnder(dir: string, extension: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(extension))
    .map((file) => join(dir, file))
    .sort(byCodePoint);
}

/** Every HTML page of a build, sorted by path. */
export function readPages(buildDir: string): PageSource[] {
  return filesUnder(buildDir, ".html").map((file) => ({
    file: relative(buildDir, file).split(sep).join("/"),
    html: readFileSync(file, "utf8"),
  }));
}

/** Every stylesheet under a theme root, sorted by path. */
export function readStylesheets(themeRoot: string): Stylesheet[] {
  return filesUnder(themeRoot, ".css").map((file) => ({ file: displayPath(file), css: readFileSync(file, "utf8") }));
}

/** Comments become spaces (newlines kept) so offsets and line numbers stay useful. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
}

/** Every innermost `{ … }` block of a stylesheet: its selector, declarations, and line. */
function rulesOf(css: string): Rule[] {
  const source = stripComments(css);
  const found: Rule[] = [];
  for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const raw = match[1] ?? "";
    const at = (match.index ?? 0) + Math.max(raw.search(/\S/), 0);
    found.push({ selector: raw.trim(), body: match[2] ?? "", line: source.slice(0, at).split("\n").length });
  }
  return found;
}

/** True when a selector names an element, such as `pre` in `:where(pre, code)`. */
function selectorNames(selector: string, element: string): boolean {
  return new RegExp(`(^|[^\\w-])${element}([^\\w-]|$)`).test(selector);
}

/** The attributes of the first `<html>` tag of a page, or `undefined` when it has none. */
export function htmlAttributes(html: string): Record<string, string> | undefined {
  const tag = /<html\b([^>]*)>/i.exec(html);
  if (tag === null) return undefined;
  const attributes: Record<string, string> = {};
  for (const match of (tag[1] ?? "").matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    const name = (match[1] ?? "").toLowerCase();
    attributes[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

/** Every page's `<html>` says `dir="rtl"` and the config's language. */
export function checkDirection(pages: readonly PageSource[], lang: string): Finding[] {
  if (pages.length === 0) return [{ check: "direction", message: "the build has no HTML page" }];
  const findings: Finding[] = [];
  for (const page of pages) {
    const attributes = htmlAttributes(page.html);
    if (attributes === undefined) {
      findings.push({ check: "direction", message: `${page.file} has no <html> element` });
      continue;
    }
    if (attributes.dir !== "rtl") {
      findings.push({ check: "direction", message: `${page.file} renders dir="${attributes.dir ?? ""}", not dir="rtl"` });
    }
    if ((attributes.lang ?? "").toLowerCase() !== lang.toLowerCase()) {
      findings.push({ check: "direction", message: `${page.file} renders lang="${attributes.lang ?? ""}", not lang="${lang}"` });
    }
  }
  return findings;
}

/** At least one page renders a code block, and the theme keeps `pre`, `code`, and `kbd` left to right. */
export function checkCode(pages: readonly PageSource[], stylesheets: readonly Stylesheet[]): { findings: Finding[]; codePages: number } {
  const findings: Finding[] = [];
  const withCode = pages.filter((page) => /<pre\b[^>]*>[\s\S]*?<code\b/i.test(page.html));
  if (withCode.length === 0) {
    findings.push({ check: "code", message: "no page renders a code block (<pre><code>), so the left-to-right rule is untested" });
  }

  if (stylesheets.length === 0) {
    findings.push({ check: "code", message: "the theme has no stylesheet, so code has no left-to-right rule" });
    return { findings, codePages: withCode.length };
  }

  // `styles/rtl.css` holds the rule today, but any theme stylesheet may, so the check reads them all.
  const rules = stylesheets.flatMap((sheet) => rulesOf(sheet.css));
  for (const element of ["pre", "code", "kbd"]) {
    const covered = rules.some(
      (rule) =>
        selectorNames(rule.selector, element) &&
        /\bdirection\s*:\s*ltr\b/i.test(rule.body) &&
        /\bunicode-bidi\s*:\s*isolate\b/i.test(rule.body),
    );
    if (!covered) {
      findings.push({
        check: "code",
        message: `no theme stylesheet sets both direction: ltr and unicode-bidi: isolate for ${element}`,
      });
    }
  }
  return { findings, codePages: withCode.length };
}

/** A selector is in a right-to-left context when it reads `[dir="rtl"]` or `:dir(rtl)`. */
function inRtlContext(selector: string): boolean {
  return /\[dir\s*=\s*["']?rtl["']?\]|:dir\(rtl\)/i.test(selector);
}

/** A selector that turns over for the right-to-left page: `scaleX(-1)` mirrors, a `rotate` flips a corner. */
function mirrors(rule: Rule): boolean {
  return inRtlContext(rule.selector) && /\btransform\s*:/.test(rule.body) && /scaleX\(\s*-1\s*\)|rotate\(/i.test(rule.body);
}

/** A selector that draws a horizontal icon: an arrow, chevron, caret, or separator, or a rotated corner. */
function drawsDirectionalIcon(rule: Rule): boolean {
  if (inRtlContext(rule.selector)) return false;
  if (/\b(arrow|chevron|caret|separator|sep)\b/i.test(rule.selector)) return true;
  return /::?(before|after)\b/.test(rule.selector) && /\btransform\s*:\s*rotate\(/i.test(rule.body);
}

/**
 * Icons that never point along the reading direction: the page-agent menu's disclosure chevron points down and
 * turns over when the menu opens, so a mirror rule would be wrong. A new neutral icon belongs here with a reason.
 */
const DIRECTION_NEUTRAL = [/\bpage-agent-menu-chevron\b/] as const;

/** A selector with its direction context removed, so a base rule and its mirror compare equal. */
function withoutDirection(selector: string): string {
  return selector
    .replace(/\[dir\s*=\s*["']?rtl["']?\]\s*/gi, "")
    .replace(/:dir\(rtl\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The last compound of a selector: `.home-arrow` in `[dir="rtl"] .home-arrow`, `.x::before` in `.a > .x::before`. */
function iconKey(selector: string): string {
  const base = withoutDirection(selector);
  return /([.#][\w-]+(?:::{1,2}[\w-]+)?)\s*$/.exec(base)?.[1] ?? base;
}

/** The one `transform` declaration of a rule, for the printed mechanism. */
function transformOf(body: string): string {
  const match = /\btransform\s*:\s*([^;]+)/i.exec(body);
  return match === null ? "transform" : `transform: ${(match[1] ?? "").trim()}`;
}

/** Every directional icon has a mirror rule or logical properties only; each is reported. */
export function checkIcons(stylesheets: readonly Stylesheet[]): { findings: Finding[]; icons: IconRule[]; notes: string[] } {
  const rules = stylesheets.flatMap((sheet) => rulesOf(sheet.css).map((rule) => ({ ...rule, file: sheet.file })));
  const mirrorRules = rules.filter(mirrors);
  const findings: Finding[] = [];
  const icons: IconRule[] = [];
  const notes: string[] = [];

  for (const rule of rules) {
    if (!drawsDirectionalIcon(rule)) continue;
    if (DIRECTION_NEUTRAL.some((pattern) => pattern.test(rule.selector))) {
      notes.push(`direction-neutral icon: ${rule.file}:${rule.line} ${rule.selector} (it never points along the reading direction)`);
      continue;
    }
    const physical = findPhysical(rule.body, rule.file);
    if (physical.length > 0) {
      findings.push({ check: "icons", message: `${rule.selector} pins its icon with a physical property: ${physical[0] ?? ""}` });
      continue;
    }
    const key = withoutDirection(rule.selector);
    const mirror =
      mirrorRules.find((candidate) => withoutDirection(candidate.selector) === key) ??
      mirrorRules.find((candidate) => iconKey(candidate.selector) === iconKey(rule.selector));
    icons.push({
      file: rule.file,
      line: rule.line,
      selector: rule.selector,
      mechanism:
        mirror === undefined
          ? "logical: logical properties only, so the browser mirrors its place"
          : `mirror: ${mirror.file}:${mirror.line} ${mirror.selector} { ${transformOf(mirror.body)} }`,
    });
  }

  if (icons.length === 0) findings.push({ check: "icons", message: "the theme has no directional icon selector to follow the reading direction" });
  else if (!icons.some((icon) => icon.mechanism.startsWith("mirror"))) {
    findings.push({ check: "icons", message: "no directional icon mirrors under dir=rtl (expected a transform: scaleX(-1) or :dir(rtl) rule)" });
  }
  return { findings, icons, notes };
}

/** No theme stylesheet uses a physical CSS property. */
export function checkLogical(stylesheets: readonly Stylesheet[]): Finding[] {
  if (stylesheets.length === 0) return [{ check: "logical", message: "the theme has no stylesheet to lint" }];
  return stylesheets.flatMap((sheet) => findPhysical(sheet.css, sheet.file).map((message) => ({ check: "logical", message })));
}

/** Runs every check on a built site and its theme. */
export function analyze(input: RtlInput): RtlResult {
  const notes: string[] = [];
  const links = input.pages.some((page) => /<link\b[^>]*\brel=["']stylesheet["']/i.test(page.html));
  if (input.pages.length > 0 && !links) {
    notes.push(
      "the build links no theme stylesheet (pre-existing); the code and icon rules were checked in the theme's CSS, not in computed styles.",
    );
  }

  const code = checkCode(input.pages, input.stylesheets);
  const icons = checkIcons(input.stylesheets);
  return {
    findings: [...checkDirection(input.pages, input.lang), ...code.findings, ...icons.findings, ...checkLogical(input.stylesheets)],
    notes: [...notes, ...icons.notes],
    icons: icons.icons,
    lang: input.lang,
    pages: input.pages.length,
    codePages: code.codePages,
    stylesheets: input.stylesheets.length,
  };
}

/** Prints what the gate found and says whether it passed. */
export function report(result: RtlResult): boolean {
  for (const icon of result.icons) console.log(`icon: ${icon.file}:${icon.line} ${icon.selector} — ${icon.mechanism}`);
  for (const note of result.notes) console.log(`note: ${note}`);
  for (const finding of result.findings) console.error(`FAIL rtl ${finding.check}: ${finding.message}`);
  if (result.findings.length > 0) {
    console.error(`FAIL: rtl: ${result.findings.length} problem(s) across ${result.pages} page(s).`);
    return false;
  }
  console.log(
    `OK: rtl (${result.pages} page(s) dir=rtl lang=${result.lang}, code stays ltr on ${result.codePages} page(s), ` +
      `${result.icons.length} directional icon(s), ${result.stylesheets} logical stylesheet(s))`,
  );
  return true;
}

/** A built fixture, ready to check, and the way to remove its temporary folder. */
export interface FixtureSite {
  /** The output folder of the build. */
  readonly buildDir: string;
  /** The config's language. */
  readonly lang: string;
  /** Removes the temporary folder. */
  readonly cleanup: () => Promise<void>;
}

/** Builds `fixtures/rtl-site` from a temporary copy whose config the engine can read. */
export async function buildFixture(options: { readonly repo?: string } = {}): Promise<FixtureSite> {
  const repo = resolve(options.repo ?? root);
  const source = join(repo, "fixtures", FIXTURE);
  if (!existsSync(source)) {
    throw new Error(`fixtures/${FIXTURE} does not exist under ${repo}; the gate has nothing to build`);
  }

  const dir = await mkdtemp(join(tmpdir(), "slipway-rtl-"));
  const site = join(dir, "site");
  try {
    await cp(source, site, { recursive: true });
    const oldConfig = join(site, OLD_CONFIG);
    if (existsSync(oldConfig)) await rename(oldConfig, join(site, CONFIG));
    else if (!existsSync(join(site, CONFIG))) throw new Error(`fixtures/${FIXTURE} has neither ${OLD_CONFIG} nor ${CONFIG}`);

    const result = await build({
      root: site,
      out: join(dir, "out"),
      themeRoot: join(repo, "packages/theme"),
      defaultLayout: DEFAULT_LAYOUT,
    });
    const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === "error");
    if (errors.length > 0) {
      throw new Error(`fixtures/${FIXTURE} has ${errors.length} build error(s):\n${errors.map((d) => `  ${d.id}: ${d.message}`).join("\n")}`);
    }
    return { buildDir: result.out, lang: loadConfig(site).config.lang, cleanup: () => rm(dir, { recursive: true, force: true }) };
  } catch (err) {
    await rm(dir, { recursive: true, force: true });
    throw err;
  }
}

/** The gate's entry point. */
export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const siteAt = argv.indexOf("--site");
  const langAt = argv.indexOf("--lang");
  const lang = langAt === -1 ? DEFAULT_LANG : (argv[langAt + 1] ?? DEFAULT_LANG);
  const notes: string[] = [];
  let buildDir: string;
  let cleanup: (() => Promise<void>) | undefined;

  if (siteAt !== -1) {
    buildDir = argv[siteAt + 1] ?? "";
    if (buildDir === "" || !existsSync(buildDir)) {
      console.error(`FAIL: rtl: ${buildDir === "" ? "--site needs a folder" : `${buildDir} does not exist`}`);
      return 1;
    }
  } else {
    try {
      const fixture = await buildFixture();
      buildDir = fixture.buildDir;
      cleanup = fixture.cleanup;
      notes.push(
        `fixtures/${FIXTURE} names its config ${OLD_CONFIG} and the engine reads ${CONFIG}; the gate built a copy with the config renamed (follow-up: rename the fixture).`,
      );
    } catch (err) {
      console.error(`FAIL: rtl: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
  }

  try {
    const result = analyze({ pages: readPages(buildDir), stylesheets: readStylesheets(join(root, "packages/theme")), lang });
    const withNotes: RtlResult = { ...result, notes: [...notes, ...result.notes] };
    return report(withNotes) ? 0 : 1;
  } finally {
    if (cleanup !== undefined) await cleanup();
  }
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
