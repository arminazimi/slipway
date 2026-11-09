import type { Page, Site } from "../contracts/content.ts";
import type { Output, OutputContext, OutputFile } from "../contracts/output.ts";
import type { SourcePos } from "../contracts/source.ts";

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Escapes the characters that would end an HTML attribute or a text node early. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * A JavaScript string literal for `text`, safe inside a `<script>` element: JSON quoting handles quotes, backslashes,
 * and control characters, and the Unicode escapes keep `</script>` and `<!--` from ending the element early.
 */
function jsString(text: string): string {
  return JSON.stringify(text)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Strips the site `base` from a URL, along whole path segments only. Every URL the model carries includes `base`,
 * while the output folder is what deploys under `base` (GitHub Pages project sites), so the file path must not repeat
 * it. A URL that does not start with the base passes through untouched, as it does in the HTML output.
 */
function underBase(url: string, base: string): string {
  if (base === "") return url;
  if (url === base || url.startsWith(`${base}/`)) return url.slice(base.length) || "/";
  return url;
}

/**
 * The file a URL writes, relative to the output folder: a pretty URL (`/old/`, `/old`) becomes `old/index.html`, and
 * a URL that already names a file (`/old.html`, `/old.mp3`) is written exactly. This mirrors `indexPath` in
 * `html.ts`, so a redirect and a page can never disagree about the file an address names.
 */
function filePath(url: string): string {
  const last = url.slice(url.lastIndexOf("/") + 1);
  const path = last.includes(".") ? url : `${url.endsWith("/") ? url : `${url}/`}index.html`;
  return path.replace(/^\//, "");
}

/**
 * Normalizes an old path from the config or from `redirect_from`: a path starting with `/`, with no query, fragment,
 * backslash, control character, or `.`/`..` segment. Returns `undefined` for a value that cannot name a file safely.
 */
function normalizeOldPath(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (path.includes("\\") || path.includes("?") || path.includes("#")) return undefined;
  if (/[\u0000-\u001f\u007f]/.test(path)) return undefined;
  const segments = path.split("/").slice(1);
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const last = i === segments.length - 1;
    if (segment === "" && !last) return undefined;
    if (segment === "." || segment === "..") return undefined;
  }
  return path;
}

/** The origin absolute URLs start with, from `url` in the site config; `undefined` when it is absent or not a URL. */
function originOf(site: Site): string | undefined {
  const value = site.config.url?.trim() ?? "";
  if (value === "") return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.origin : undefined;
  } catch {
    return undefined;
  }
}

/** The site-relative URL for a path written under `base`, adding `base` once. */
function sitePath(path: string, base: string): string {
  if (base === "" || path === base || path.startsWith(`${base}/`)) return path;
  return path === "/" ? `${base}/` : `${base}${path}`;
}

/**
 * The target of a config redirect: an `https` URL as written, or a path on the site made absolute when the site sets
 * `url`. A value that is neither is not a redirect target, and the caller reports it.
 */
function configTarget(value: string, site: Site): string | undefined {
  const target = value.trim();
  if (target === "") return undefined;
  if (/[\u0000-\u001f\u007f]/.test(target)) return undefined;
  if (/^https:\/\//i.test(target)) return target;
  if (!target.startsWith("/")) return undefined;
  const path = sitePath(target, site.config.base);
  const origin = originOf(site);
  return origin === undefined ? path : `${origin}${path}`;
}

/** The target of a `redirect_from`: the page's URL, already carrying `base`, made absolute when the site sets `url`. */
function pageTarget(page: Page, site: Site): string {
  const origin = originOf(site);
  return origin === undefined ? page.url : `${origin}${page.url}`;
}

/**
 * The redirect page: a meta refresh, a canonical link to the new address, a plain link for readers whose browser does
 * not follow the refresh, and one script that replaces the location without adding a history entry. Every value is
 * escaped for the place it lands in, so a URL with `&`, quotes, or `</script>` cannot break the document.
 */
function redirectHtml(site: Site, target: string): string {
  const href = escapeHtml(target);
  return [
    "<!doctype html>",
    `<html lang="${escapeHtml(site.config.lang)}" dir="${escapeHtml(site.config.dir)}">`,
    "<head>",
    '<meta charset="utf-8">',
    "<title>Redirecting</title>",
    `<link rel="canonical" href="${href}">`,
    '<meta name="robots" content="noindex">',
    `<meta http-equiv="refresh" content="0; url=${href}">`,
    `<script>location.replace(${jsString(target)})</script>`,
    "</head>",
    "<body>",
    `<p>This page moved to <a href="${href}">${href}</a>.</p>`,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

/** One old path and the target it sends readers to. */
interface Claim {
  /** The old path, normalized to start with `/`. */
  readonly oldPath: string;
  /** The new address, absolute when the site sets `url`, else site-relative. */
  readonly target: string;
  /** Where the claim came from, for a duplicate's message: the site config or a page. */
  readonly from: string;
  /** The source position of a front matter claim, when it has one. */
  readonly pos?: SourcePos;
}

/**
 * Writes a small redirect page at every old address, from the config's `redirects` map and from each page's
 * `redirect_from` (a string or a list).
 *
 * A path is under `base`, as the config and the front matter define it: `/old/` and `/old` both write
 * `old/index.html`, and a path that names a file (`/old.html`, `/old.mp3`) writes that file exactly, as the HTML
 * output does for a page URL. The target is a path on the site (with `base` added) or an `https` URL; when the site
 * sets `url`, every target is absolute, and otherwise it is site-relative.
 *
 * A redirect that would overwrite a real page, and an old path claimed twice, are errors. The first claim wins: the
 * config before the front matter, and pages in model order. Files come back sorted by path (ADR 0022, rule 5).
 */
export const redirects: Output = {
  name: "redirects",
  async run(site: Site, ctx: OutputContext): Promise<readonly OutputFile[]> {
    const base = site.config.base;
    const files: OutputFile[] = [];
    const claimed = new Map<string, Claim>();

    const pagesByPath = new Map<string, Page>();
    for (const page of site.pages) {
      if (page.kind !== "doc" && page.kind !== "app") continue;
      pagesByPath.set(filePath(underBase(page.url, base)), page);
    }

    const add = (claim: Claim): void => {
      const path = filePath(underBase(claim.oldPath, base));
      const page = pagesByPath.get(path);
      if (page !== undefined) {
        ctx.report({
          id: "redirects.over-page",
          severity: "error",
          message: `The redirect from ${quote(claim.oldPath)} would replace the page ${quote(page.url)}.`,
          ...(claim.pos === undefined ? {} : { pos: claim.pos }),
          help: "Choose another old path, or remove the page that owns this one.",
        });
        return;
      }

      const first = claimed.get(path);
      if (first !== undefined) {
        const where = first.from === claim.from ? first.from : `${first.from} and ${claim.from}`;
        ctx.report({
          id: "redirects.duplicate",
          severity: "error",
          message: `The old path ${quote(claim.oldPath)} writes the same file as ${quote(first.oldPath)}, claimed by ${where}.`,
          ...(claim.pos === undefined ? {} : { pos: claim.pos }),
          help: "Keep one redirect for each old path.",
        });
        return;
      }

      claimed.set(path, claim);
      files.push({ path, contents: redirectHtml(site, claim.target) });
    };

    for (const oldPath of Object.keys(site.config.redirects).sort(byCodePoint)) {
      const value: unknown = site.config.redirects[oldPath];
      const normalized = normalizeOldPath(oldPath);
      if (normalized === undefined) {
        ctx.report({
          id: "redirects.invalid-old-path",
          severity: "error",
          message: `The redirect key ${quote(oldPath)} is not a safe site path.`,
          help: 'Use a path starting with "/" and with no "..", "?", "#", or backslash.',
        });
        continue;
      }
      if (typeof value !== "string") {
        ctx.report({
          id: "redirects.invalid-target",
          severity: "error",
          message: `The redirect from ${quote(oldPath)} has no target.`,
          help: 'Give it a path starting with "/" or an https URL.',
        });
        continue;
      }
      const target = configTarget(value, site);
      if (target === undefined) {
        ctx.report({
          id: "redirects.invalid-target",
          severity: "error",
          message: `The redirect from ${quote(oldPath)} targets ${quote(value)}, which is neither a site path nor an https URL.`,
          help: 'Use a path starting with "/" or an https URL.',
        });
        continue;
      }
      add({ oldPath: normalized, target, from: "the site config" });
    }

    for (const page of site.pages) {
      const raw: unknown = page.frontMatter.redirect_from;
      if (raw === undefined) continue;
      const values: readonly unknown[] = Array.isArray(raw) ? raw : [raw];
      for (const value of values) {
        if (typeof value !== "string") {
          ctx.report({
            id: "redirects.invalid-old-path",
            severity: "error",
            message: `A redirect_from entry of the page ${quote(page.url)} is not a string.`,
            pos: page.source,
            help: "List old paths as strings in front matter.",
          });
          continue;
        }
        const normalized = normalizeOldPath(value);
        if (normalized === undefined) {
          ctx.report({
            id: "redirects.invalid-old-path",
            severity: "error",
            message: `The page ${quote(page.url)} redirects from ${quote(value)}, which is not a safe site path.`,
            pos: page.source,
            help: 'Use a path starting with "/" and with no "..", "?", "#", or backslash.',
          });
          continue;
        }
        add({ oldPath: normalized, target: pageTarget(page, site), from: `the page ${quote(page.url)}`, pos: page.source });
      }
    }

    return files.sort((a, b) => byCodePoint(a.path, b.path));
  },
};

/** A value between straight quotes, for a message that never renders markup. */
function quote(value: string): string {
  return `"${value}"`;
}
