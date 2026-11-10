// Valid HTML gate (issue #1157): every page of an engine build passes html-validate.
//
//   node tools/html-validate-engine/run.ts             build both fixtures and validate every page
//   node tools/html-validate-engine/run.ts <build>     validate one engine build folder
//
// The config starts from html-validate:recommended. The extensions cover the engine's output and anything a site
// copies in unchanged: it writes XHTML-style void elements and an uppercase DOCTYPE, while a copied app page may
// write the HTML style or a lowercase DOCTYPE (both are valid HTML5). `sl-*` custom elements are allowed because a
// site supplies its own metadata for them. The remaining relaxations name pre-existing theme markup; see the
// comments beside each rule. The gate reports every finding and fails on errors only.
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { HtmlValidate, type ConfigData } from "html-validate";
import { builtSite, FIXTURES, type FixtureName } from "../fixture-build/build.ts";

/** Folders that never hold a page a visitor loads. */
const SKIP_DIRS = new Set(["node_modules", ".git", ".tmp"]);

/**
 * The validator config. Every deviation from html-validate:recommended has a reason:
 *
 * - `doctype-style` and `void-style` are style rules, not validity rules. The engine writes `<!DOCTYPE html>` and
 *   `<meta …/>`; the dashboard app page the docs fixture copies writes `<!doctype html>` and `<meta …>`. Both forms
 *   are valid HTML5, so neither style may fail the gate.
 * - `unique-landmark` is an accessibility rule. The theme emits two `<nav aria-label="Site navigation">` landmarks
 *   (the header drawer and the sidebar) and two `<aside aria-label="On this page">` landmarks on every page, which
 *   the rule rejects. Fixing that changes the theme, not the gate; tracked separately.
 * - The theme wraps a `<header class="header">` in the page's `<header>`, which HTML forbids. The override keeps
 *   the rule and the other `header` exclusions, allowing only this nesting.
 * - `prefer-native-element` rejects `role="listbox"` because a `<select>` exists. The search dialog's result list is
 *   built at run time from Pagefind hits, holds links and snippets, and sits next to a text field; a `<select>`
 *   cannot hold that, so the role is the right markup. The rule stays on for every other role.
 * - `sl-*` is the theme's custom-element prefix. html-validate has no metadata for them, so `no-unknown-elements`
 *   must ignore them; every other unknown element still fails.
 */
export const config: ConfigData = {
  extends: ["html-validate:recommended"],
  elements: [
    "html5",
    {
      header: {
        flow: true,
        permittedContent: ["@flow"],
        permittedDescendants: [{ exclude: ["footer", "main"] }],
      },
    },
  ],
  rules: {
    "doctype-style": "off",
    "no-unknown-elements": ["error", { exclude: ["sl-*"] }],
    "prefer-native-element": ["error", { mapping: { listbox: "" } }],
    "unique-landmark": "off",
    "void-style": "off",
  },
};

/** One html-validate message, located in a build-relative page. */
export interface Finding {
  /** Build-relative page path, with `/` separators. */
  readonly page: string;
  readonly line: number;
  readonly column: number;
  readonly ruleId: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

/** What validating one build folder found. */
export interface ValidationReport {
  /** Number of HTML pages validated. */
  readonly pages: number;
  /** Every message, in page and document order. */
  readonly findings: readonly Finding[];
  /** Findings with severity `error`, the ones that fail the gate. */
  readonly errors: number;
  /** Problems that stopped the gate from validating the build. */
  readonly problems: readonly string[];
}

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** A build-relative path with `/` separators, the way HTML and URLs write it. */
function buildPath(file: string, root: string): string {
  return relative(root, file).split(sep).join("/");
}

/** Every HTML page under `dir`, sorted by path. */
export function htmlFiles(dir: string): string[] {
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

/** A validator with {@link config}; a test builds its own to validate a string. */
export function validator(): HtmlValidate {
  return new HtmlValidate(config);
}

/** How many pages one run validates at once; enough to stay fast without holding whole large builds in memory. */
const CONCURRENCY = 8;

/** Validates every HTML page under `dir`. */
export async function validateBuild(dir: string, htmlvalidate: HtmlValidate = validator()): Promise<ValidationReport> {
  const root = resolve(dir);
  if (!existsSync(root)) return { pages: 0, findings: [], errors: 0, problems: [`${root} does not exist`] };
  if (!statSync(root).isDirectory()) {
    return { pages: 0, findings: [], errors: 0, problems: [`${root} is not a directory`] };
  }

  const pages = htmlFiles(root);
  if (pages.length === 0) return { pages: 0, findings: [], errors: 0, problems: [`${root} has no HTML pages`] };

  // A page's messages are written to its own slot, so the report stays in page order however the workers interleave.
  const perPage: Finding[][] = Array.from({ length: pages.length }, () => []);
  let next = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const index = next++;
      if (index >= pages.length) return;
      const file = pages[index]!;
      const report = await htmlvalidate.validateFile(file);
      for (const result of report.results) {
        for (const message of result.messages) {
          perPage[index]!.push({
            page: buildPath(file, root),
            line: message.line,
            column: message.column,
            ruleId: message.ruleId,
            message: message.message,
            severity: message.severity >= 2 ? "error" : "warning",
          });
        }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pages.length) }, () => worker()));

  const findings = perPage.flat();
  const errors = findings.filter((finding) => finding.severity === "error").length;
  return { pages: pages.length, findings, errors, problems: [] };
}

/** Formats one finding as `file:line:column: message (rule)`. */
export function formatFinding(finding: Finding): string {
  return `${finding.page}:${finding.line}:${finding.column}: ${finding.message} (${finding.ruleId})`;
}

/** Prints a build's result and says whether it passed. */
function report(label: string, result: ValidationReport): boolean {
  if (result.problems.length > 0) {
    console.error(`FAIL: valid HTML ${label}: ${result.problems.length} problem(s)`);
    for (const problem of result.problems) console.error(`  ${problem}`);
    return false;
  }

  for (const finding of result.findings) {
    const stream = finding.severity === "error" ? console.error : console.warn;
    stream(`  ${formatFinding(finding)}`);
  }
  if (result.errors > 0) {
    console.error(`FAIL: valid HTML ${label}: ${result.errors} error(s) on ${result.pages} page(s)`);
    return false;
  }

  const warnings = result.findings.length;
  const suffix = warnings === 0 ? "" : `, ${warnings} warning(s)`;
  console.log(`OK: valid HTML ${label} (${result.pages} pages${suffix})`);
  return true;
}

/** Runs the gate on both fixtures, or on one build folder when one is given. */
export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const one = argv[0];
  if (one !== undefined) return report(one, await validateBuild(one)) ? 0 : 1;

  let passed = true;
  for (const name of FIXTURES as readonly FixtureName[]) {
    let dir: string;
    try {
      dir = await builtSite(name);
    } catch (err) {
      console.error(`FAIL: valid HTML ${name}: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
    if (!report(name, await validateBuild(dir))) passed = false;
  }
  return passed ? 0 : 1;
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
