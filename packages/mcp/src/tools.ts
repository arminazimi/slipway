// Helpers shared by the tools in ./tools/. Each tool lives in its own file there and exports `definition` and `handler(site, args)`.
import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontMatter, type FrontMatterResult } from "../../engine/src/content/frontmatter.ts";
import { permalink } from "../../engine/src/content/permalink.ts";

export const themeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export function outside(base, target) {
  const rel = relative(base, target);
  return rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel);
}

/** The real path of `path` inside `site`; throws when it resolves (symlinks included) outside the site. */
export function insideSite(site, path) {
  const base = realpathSync(site);
  const target = resolve(base, path);
  if (outside(base, target)) throw new Error(`${path} is outside the site directory`);
  if (!existsSync(target)) throw new Error(`${path} does not exist in the site`);
  if (outside(base, realpathSync(target))) throw new Error(`${path} is outside the site directory`);
  return realpathSync(target);
}

/** Folders a tool walks past: build output, caches, and dependencies hold no pages an author edits. */
const skipDirs = new Set([".git", ".slipway", ".tmp", "_site", "node_modules", "vendor"]);

/** The folder the config's `source` names, resolved under the site root (project sites keep pages in a subfolder). */
export function contentRoot(site: string, source: string): string {
  return source === "" || source === "." ? site : join(site, source);
}

/** The `source` folder as a path prefix (`""` or `docs/`). */
function sourcePrefix(source: string): string {
  const clean = source.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
  return clean === "" || clean === "." ? "" : `${clean}/`;
}

/** A path relative to the site as the engine names it: relative to `source` when it sits inside it. */
export function sourceRelative(siteRel: string, source: string): string {
  const prefix = sourcePrefix(source);
  return prefix !== "" && siteRel.startsWith(prefix) ? siteRel.slice(prefix.length) : siteRel;
}

/** The engine's `source`-relative path back as a path relative to the site. */
export function siteRelative(sourceRel: string, source: string): string {
  return `${sourcePrefix(source)}${sourceRel}`;
}

/** Markdown pages under `site`, relative to it with `/` separators, sorted. */
export function markdownPages(site: string, dir = site, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) markdownPages(site, path, found);
    } else if (/\.(md|markdown)$/i.test(entry.name)) {
      found.push(relative(site, path).split(sep).join("/"));
    }
  }
  return found.sort();
}

/** A page's front matter and body, split and parsed the way the engine does (the file is `rel` in diagnostics). */
export function frontMatterOf(site: string, rel: string): FrontMatterResult {
  return parseFrontMatter(readFileSync(join(site, rel), "utf8"), rel);
}

/**
 * The page's site path, without `base`: its front matter `permalink` when set, else the pretty URL the engine
 * derives from the path (`a/b.md` → `/a/b/`, `a/index.md` → `/a/`).
 */
export function pagePath(rel: string, data: Record<string, unknown> = {}): string {
  const value = data.permalink;
  return permalink(rel, typeof value === "string" ? { permalink: value } : {});
}

/** Prefix a site path with `base`, as the engine's navigation and page URLs do (ADR 0024). */
export function withBase(base: string, path: string): string {
  if (base === "" || base === "/") return path;
  return path === "/" ? `${base}/` : `${base}${path}`;
}

/** Strip `base` from a site path, whole segments only, so front matter and navigation can be compared. */
export function withoutBase(path: string, base: string): string {
  if (base === "" || base === "/") return path;
  if (path === base) return "/";
  return path.startsWith(`${base}/`) ? path.slice(base.length) : path;
}

/** A site path in the form links are compared in: no query, fragment, `index.html`, or trailing slash. */
export function comparablePath(url: string): string {
  const path = withoutFragment(url).replace(/\/index\.html$/, "/");
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** The part of a URL before its query or fragment. */
export function withoutFragment(url: string): string {
  return url.replace(/[?#].*$/, "");
}

/** True for a URL that leaves the site: a scheme (`https:`, `mailto:`) or a protocol-relative `//host`. */
export function isExternal(target: string): boolean {
  return /^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|\/\/)/.test(target);
}

/** The 1-based line of a character offset in `text`. */
export function lineAt(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}
