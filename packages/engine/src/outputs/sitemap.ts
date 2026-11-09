import type { Page, Site } from "../contracts/content.ts";
import type { Output, OutputContext, OutputFile } from "../contracts/output.ts";
import { isAppPage } from "./app-pages.ts";

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Escapes the five characters XML reserves, so any URL can sit inside `<loc>`. */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * The scheme and host the sitemap's absolute URLs start with, from `url` in the site config. Without a valid `url`
 * the sitemap cannot be written, so the output reports a warning and returns `undefined`.
 */
function originOf(site: Site, ctx: OutputContext): string | undefined {
  const url = site.config.url?.trim() ?? "";
  const help = "Set `url` in the site config to the published scheme and host, such as `https://arminazimi.github.io`.";
  if (url === "") {
    ctx.report({
      id: "sitemap.no-url",
      severity: "warning",
      message: "sitemap.xml is not written: the site config has no `url`, and a sitemap needs absolute URLs.",
      help,
    });
    return undefined;
  }
  try {
    return new URL(url).origin;
  } catch {
    ctx.report({
      id: "sitemap.invalid-url",
      severity: "warning",
      message: `sitemap.xml is not written: the site config's \`url\` (${url}) is not an absolute URL.`,
      help,
    });
    return undefined;
  }
}

/**
 * The page's `lastmod`, from its `updated` front matter, as `YYYY-MM-DD` (a date the sitemap protocol accepts). A
 * time and an offset after the date are dropped. A value that is not a real calendar date is left out, not guessed,
 * and so is a page that sets no `updated`.
 */
function lastmod(page: Page): string | undefined {
  const value = page.frontMatter.updated;
  if (typeof value !== "string") return undefined;
  const match = /^\d{4}-\d{2}-\d{2}/.exec(value.trim());
  if (!match) return undefined;
  const date = match[0];
  const time = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== date) return undefined;
  return date;
}

/**
 * Writes `sitemap.xml`: one `<url>` per doc page, with the absolute URL (the config's `url` plus the page's URL, which
 * already carries `base`) and `lastmod` when the page sets `updated`. A page with `sitemap: false` is left out, and so
 * is every app page, because the config has no key that lists one (the frozen config schema decides that).
 *
 * Entries come back sorted by URL (ADR 0022, rule 5). A site without a valid `url` gets no file and a warning.
 */
export const sitemap: Output = {
  name: "sitemap",
  async run(site: Site, ctx: OutputContext): Promise<readonly OutputFile[]> {
    const origin = originOf(site, ctx);
    if (origin === undefined) return [];

    const pages = site.pages
      .filter((p) => p.kind === "doc" && p.frontMatter.sitemap !== false && !isAppPage(p.url, { pages: site.pages }))
      .sort((a, b) => byCodePoint(a.url, b.url));

    const entries = pages.map((p) => {
      const loc = escapeXml(new URL(p.url, origin).href);
      const date = lastmod(p);
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        ...(date === undefined ? [] : [`    <lastmod>${date}</lastmod>`]),
        "  </url>",
      ].join("\n");
    });

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries,
      "</urlset>",
      "",
    ].join("\n");

    return [{ path: "sitemap.xml", contents: xml }];
  },
};
