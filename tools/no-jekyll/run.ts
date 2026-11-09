// Gate: Jekyll does not come back (ROADMAP.md, `cleanup.no-jekyll`).
//
//   node tools/no-jekyll/run.ts
//
// Fails on the word `jekyll`, `liquid`, or `remote_theme`, on a Liquid `{%` tag,
// and on Ruby or Liquid files in the code, config, and content that ship from
// this repository. It reads the tree, not `git ls-files`, so an untracked file
// fails too.
//
// This is not a grep for history. Every exception below is a place that must
// still name Jekyll to remove it: the ADRs and changelog, the migration tool,
// the adapters, the doctor (it detects legacy sites and keeps frozen `jekyll.*`
// check IDs), and test fixtures that model old sites. Comments and prose
// descriptions are documentation, so they are masked before the tokens are
// read; code, config keys, and content are not.
//
// The repository's own `site/` still has legacy Jekyll/Liquid pages. They are
// excluded as prose only (see `siteCodeOrConfig`), so a Liquid tag in a site
// config or script is still caught. Those pages are rewritten by `site.guides`,
// `site.components`, `site.recipes`, and `site.trim`; this gate does not edit
// them.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { root } from "../root.ts";

/** One token, or one Ruby/Liquid file, in a scanned path. `line` is 1-based. */
export type Finding = { path: string; line: number; token: string; text: string };

/** Folders that are never source: dependencies, VCS, scratch builds, and generated sites. */
const SKIPPED_DIRS = new Set(["node_modules", ".git", ".tmp", "_site", ".slipway", "coverage"]);

/**
 * Paths the gate scans. Documentation, planning, specs, and the root prose files
 * are left out because they record the removal in words; `isScanned` keeps the
 * shipped and configured parts.
 */
const SCAN_ROOTS = new Set([
  ".github",
  "action",
  "examples",
  "fixtures",
  "packages",
  "plugins",
  "schema",
  "site",
  "skills",
  "starter-files",
  "tools",
]);

/** Files and folders that must still name Jekyll in order to remove it. */
const ALLOWED_PREFIXES = [
  "docs/adr/", // the decisions that explain the removal
  "changelog.d/", // one-line fragments that name the issue
  "adapters/", // generators other than the engine; frozen until the standard phase
  "tools/migrate/", // the migration tool reads the old site and writes the new one
  "planning/", // the roadmap and briefs are prose
  "packages/doctor/", // detects legacy sites; its `jekyll.*` check IDs are frozen
];

/** Single files outside a documented folder that are history or a migration path. */
const ALLOWED_FILES = new Set([
  "CHANGELOG.md",
  "UPGRADING.md",
  "README.md",
  "CONTRIBUTING.md",
  "ROADMAP.md",
  "AGENTS.md",
  "CLAUDE.md",
  "site/guides/migration.md",
]);

/**
 * Paths that are prose, test data, or legacy code another roadmap item owns.
 * A pattern is easier to read than a prefix for files that are exceptions.
 */
const ALLOWED_PATTERNS: RegExp[] = [
  /(^|\/)(README|AGENTS)\.md$/, // prose in a packaged folder
  /\.test\.(ts|mjs)$/, // tests
  /(^|\/)test\//, // test fixtures
  /\/fixtures\//, // nested fixture folders; the top-level `fixtures/` is generated content and is scanned
  /^tools\/no-jekyll\//, // this gate names the tokens it bans; its tests cover the scan
  /^packages\/mcp\/src\/tools\/(list_blocks|preview)\.ts$/, // `tooling.mcp-pages`
  /^skills\/slipway-design\//, // `tooling.skills-design`
  /^starter-files\/(AGENTS|README)\.md$/, // `release.agents`, `release.readme`
  /^tools\/check\.ts$/, // the transition guard that skips Jekyll tests; `cleanup.jekyll-gates`
  /^tools\/spec\/build\.ts$/, // builds the frozen spec's Jekyll demo site; `release.docs-folder`
];

/** Extensions whose contents are read as text. */
const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".htm",
  ".js",
  ".json",
  ".jsonc",
  ".liquid",
  ".markdown",
  ".md",
  ".mjs",
  ".rb",
  ".scss",
  ".svg",
  ".toml",
  ".ts",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

/** Ruby projects and Liquid templates: a file, not a token, is enough to fail. */
const RUBY_EXTENSIONS = new Set([".rb", ".gemspec", ".liquid"]);
const RUBY_FILES = new Set(["Gemfile", "Gemfile.lock", "Rakefile", "config.ru", ".ruby-version"]);

const TOKENS: { name: string; pattern: RegExp }[] = [
  // `(?<!...)` keeps `.nojekyll`, which GitHub Pages needs, out of the gate.
  { name: "jekyll", pattern: /(?<![A-Za-z0-9])jekyll(?![A-Za-z0-9])/i },
  { name: "liquid", pattern: /(?<![A-Za-z0-9])liquid(?![A-Za-z0-9])/i },
  { name: "remote_theme", pattern: /(?<![A-Za-z0-9])remote_theme(?![A-Za-z0-9])/i },
  { name: "{%", pattern: /\{%/ },
];

function posix(path: string): string {
  return path.split("\\").join("/");
}

/** Whether a relative path is in the shipped product or its config. */
export function isScanned(rel: string): boolean {
  const path = posix(rel).replace(/^\.\//, "");
  if (!path || path.endsWith("/")) return false;
  if (path.split("/").some((segment) => SKIPPED_DIRS.has(segment))) return false;
  if (isAllowed(path)) return false;

  if (path.startsWith("site/")) return siteCodeOrConfig(path);

  const [first] = path.split("/");
  if (path.includes("/") && !SCAN_ROOTS.has(first)) return false;
  return true;
}

/** Paths that may name Jekyll because they record, migrate, or detect it. */
export function isAllowed(path: string): boolean {
  if (ALLOWED_FILES.has(path)) return true;
  if (ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) return true;
  if (ALLOWED_PATTERNS.some((pattern) => pattern.test(path))) return true;
  return false;
}

/**
 * `site/` prose is legacy content being rewritten by `site.guides`,
 * `site.components`, `site.recipes`, and `site.trim`. Its config and scripts are
 * scanned; a Liquid tag in `site/mizzen.yml` or a new `.rb` still fails.
 */
function siteCodeOrConfig(path: string): boolean {
  const base = path.slice(path.lastIndexOf("/") + 1);
  // A Ruby or Liquid file is never prose, even under a legacy content folder.
  if (RUBY_EXTENSIONS.has(extension(path)) || RUBY_FILES.has(base)) return true;
  if (/\.(md|markdown)$/.test(path)) return false;
  if (path.startsWith("site/_data/")) return false;
  return true;
}

function extension(path: string): string {
  const base = path.slice(path.lastIndexOf("/") + 1);
  const dot = base.lastIndexOf(".");
  return dot === -1 ? "" : base.slice(dot).toLowerCase();
}

/** Masks a match without moving later lines: keep the newlines, blank the rest. */
function mask(match: string): string {
  return match.replace(/[^\n]/g, " ");
}

/**
 * Replaces comments and prose `description` values with spaces so a sentence
 * about the removal does not fail the gate. The line count never changes.
 */
export function stripProse(path: string, text: string): string {
  const ext = extension(path);
  if (ext === ".json" || ext === ".jsonc") {
    return text.replace(/"description"\s*:\s*"(?:\\.|[^"\\])*"/g, mask);
  }
  if ([".ts", ".js", ".mjs", ".cjs", ".css", ".scss"].includes(ext)) {
    return text.replace(/\/\*[\s\S]*?\*\//g, mask).replace(/(^|[^:\n])\/\/[^\n]*/gm, (m, before: string) => before + mask(m.slice(before.length)));
  }
  if ([".yml", ".yaml", ".toml"].includes(ext)) {
    return text.replace(/(^|[ \t])#[^\n]*/gm, (m, before: string) => before + mask(m.slice(before.length)));
  }
  if ([".html", ".htm", ".md", ".markdown", ".svg", ".xml"].includes(ext)) {
    return text.replace(/<!--[\s\S]*?-->/g, mask);
  }
  return text;
}

function snippet(line: string): string {
  const trimmed = line.trim();
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
}

/** Findings for one file. `rel` is relative to the tree root and uses `/`. */
export function scanFile(rootDir: string, rel: string): Finding[] {
  const path = posix(rel);
  const ext = extension(path);
  const base = path.slice(path.lastIndexOf("/") + 1);

  if (RUBY_EXTENSIONS.has(ext) || RUBY_FILES.has(base)) {
    return [{ path, line: 1, token: RUBY_EXTENSIONS.has(ext) ? "Ruby/Liquid file" : "Ruby file", text: base }];
  }

  if (!TEXT_EXTENSIONS.has(ext)) return [];

  let raw: string;
  try {
    raw = readFileSync(join(rootDir, path), "utf8");
  } catch {
    return [];
  }
  // A NUL byte means a binary file that happens to share a text extension.
  if (raw.includes("\0")) return [];

  const text = stripProse(path, raw);
  const lines = text.split("\n");
  const findings: Finding[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    for (const { name, pattern } of TOKENS) {
      if (pattern.test(lines[i])) findings.push({ path, line: i + 1, token: name, text: snippet(lines[i]) });
    }
  }
  return findings;
}

function walk(dir: string, base = dir, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isSymbolicLink()) continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIPPED_DIRS.has(entry.name)) continue;
      walk(absolute, base, out);
    } else if (entry.isFile()) {
      out.push(posix(absolute.slice(base.length + 1)));
    }
  }
  return out;
}

/** Every finding under `rootDir`, sorted by path and line. */
export function scan(rootDir: string): Finding[] {
  const findings: Finding[] = [];
  for (const rel of walk(rootDir)) {
    if (!isScanned(rel)) continue;
    findings.push(...scanFile(rootDir, rel));
  }
  return findings.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.token.localeCompare(b.token));
}

export function main(rootDir = root): number {
  const findings = scan(rootDir);
  if (findings.length === 0) {
    console.log("OK no-jekyll: no Jekyll, Liquid, remote_theme, or Ruby files in the shipped product");
    return 0;
  }
  console.log("FAIL no-jekyll: Jekyll must not come back. Remove it, or add the path to the exceptions in tools/no-jekyll/run.ts with a roadmap key.");
  for (const finding of findings) console.log(`  ${finding.path}:${finding.line}: ${finding.token}: ${finding.text}`);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main();
