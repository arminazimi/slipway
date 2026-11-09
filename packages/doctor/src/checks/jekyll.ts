// Jekyll and Slipway checks. They are not spec tests: a failure is a warning and never changes the level.
// Each check takes the Site and the doctor's options and returns `{ status, findings }`; every finding
// names the file, the line when there is one, and a one-line fix.
import { blocks } from "../markdown.ts";
import { findDeprecations, packagedDeprecations } from "../deprecations.ts";
import { detect } from "../detect.ts";
import * as docsDescription from "./docs.description.ts";
import * as docsHeadingOrder from "./docs.heading-order.ts";
import * as docsOrphan from "./docs.orphan.ts";
import * as rootLinks from "./root-links.ts";

/** The files of starter-files/ in the repository, except its README: every site copies them. */
export const stubs = [".vscode/settings.json", "404.md", "AGENTS.md", "search.json"];

/**
 * Files Slipway generates at a fixed URL that a site may write itself (with or without front matter), as
 * Evergreen does with its own tools. A site's own copy replaces Slipway's stub, so none of these is ever a
 * required stub; `docs/site-files.md` lists which mode serves each URL.
 */
export const siteFiles = ["llms-full.txt", "llms.txt", "robots.txt", "sitemap.xml"];

/** The keys of _includes/i18n-builtin.html: the theme has English, Persian, Arabic, and Hebrew for each of them. */
export const builtinKeys = [
  "about_author",
  "accepted",
  "adr_date",
  "adr_deciders",
  "adr_status",
  "adr_superseded_by",
  "adr_supersedes",
  "and",
  "breadcrumbs",
  "by",
  "categories",
  "comma",
  "comments",
  "copied",
  "copy",
  "copy_failed",
  "copy_page_md",
  "default",
  "deprecated",
  "description",
  "docs_nav",
  "edit_label",
  "edit_prompt",
  "edited_on",
  "example_request",
  "example_response",
  "go_home",
  "home",
  "language",
  "last_updated",
  "latest_posts",
  "links",
  "main_nav",
  "min_read",
  "mode_auto",
  "mode_dark",
  "mode_light",
  "name",
  "next",
  "no",
  "not_found_text",
  "not_found_title",
  "on_this_page",
  "pager",
  "parameters",
  "partial",
  "post_pager",
  "posts",
  "previous",
  "proposed",
  "rejected",
  "related_posts",
  "releases",
  "required",
  "scheduled",
  "search",
  "search_count",
  "search_none",
  "series",
  "series_pager",
  "series_part",
  "skip",
  "social_links",
  "status_beta",
  "status_deprecated",
  "status_experimental",
  "status_replaced_by",
  "status_since",
  "superseded",
  "tags",
  "theme",
  "translation_key",
  "translation_missing",
  "type",
  "versions",
  "yes"
];

/** Folders that hold theme code or generated files, not content. */
const notContent = /^(_layouts|_includes|_sass|_data|_site|_drafts|vendor|node_modules)\//;
const isMarkdown = (path) => /\.(md|markdown)$/i.test(path);

/**
 * Whether the checks apply: the site is an engine site, `detect()` says Jekyll, or the config names a Slipway
 * theme. A site on the remote theme has neither a Gemfile nor `_layouts/`, so detection alone would miss it.
 */
export function applies(site) {
  if (site.config()) return true;
  if (detect(site.source).generator === "jekyll") return true;
  const { data } = config(site);
  return [data.theme, data.remote_theme].some((name) => typeof name === "string" && /slipway/i.test(name));
}

/** The site's config: the engine's `slipway.yml` when there is one, else Jekyll's `_config.yml`. */
function config(site) {
  const engine = site.config();
  if (engine?.data && typeof engine.data === "object") {
    return { name: engine.file, data: engine.data, lineOf: engine.lineOf ?? (() => 1) };
  }
  for (const name of ["_config.yml", "_config.yaml"]) {
    if (site.isFile(site.source, name)) {
      const parsed = site.dataOf(name);
      return { name, data: parsed.data ?? {}, lineOf: parsed.lineOf ?? (() => 1) };
    }
  }
  return { name: "_config.yml", data: {}, lineOf: () => 1 };
}

/** The language codes the site publishes: the engine's `languages`, `slipway.languages`, else `lang`, else English. */
function languages(site) {
  const { data } = config(site);
  const listed = (data.languages ?? data.slipway?.languages ?? [])
    .map((language) => language?.code)
    .filter((code) => typeof code === "string");
  return listed.length ? listed : [typeof data.lang === "string" ? data.lang : "en"];
}

/** Deprecated config keys an engine site sets in `slipway.yml`, with the line of each key. */
function engineDeprecations(site, deprecations) {
  const parsed = site.config();
  if (!parsed?.data || typeof parsed.data !== "object") return [];
  const found = [];
  for (const entry of deprecations) {
    if (entry.kind !== "config") continue;
    const path = entry.old.split(".");
    let value = parsed.data;
    for (const key of path) {
      if (!value || typeof value !== "object" || !(key in value)) {
        value = undefined;
        break;
      }
      value = value[key];
    }
    if (value === undefined) continue;
    const line = parsed.lineOf ? parsed.lineOf(path) : 1;
    found.push({ file: parsed.file, line, ...entry, message: `${parsed.file}:${line} ${entry.old} is deprecated since ${entry.since}, use ${entry.new}` });
  }
  return found;
}

/** Content files with front matter Jekyll renders, with their parsed front matter. */
function pages(site) {
  return site
    .files()
    .filter((path) => !notContent.test(path))
    .map((path) => ({ path, fm: site.frontMatterOf(path) }))
    .filter(({ fm }) => fm?.data && typeof fm.data === "object");
}

const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

/**
 * The ids this module renamed, as `{ new: old }`. The alias below makes the old id resolve to the same check;
 * the check runs once, and the old id keeps working in reports and `--fix`.
 */
export const renamedChecks = { "config.deprecated": "jekyll.deprecated" };

export const checks = {
  [docsDescription.id]: docsDescription.run,
  [docsHeadingOrder.id]: docsHeadingOrder.run,
  [docsOrphan.id]: docsOrphan.run,
  [rootLinks.id]: rootLinks.run,
  "jekyll.stubs": (site) =>
    result(
      stubs
        .filter((path) => !siteFiles.includes(path))
        .filter((path) => !site.isFile(site.source, path))
        .map((path) => ({ in: "source", file: path, message: "is missing", fix: `copy starter-files/${path} from the Slipway repository, or write your own ${path}` })),
    ),

  "config.deprecated": (site, { deprecations = packagedDeprecations() } = {}) => {
    const engine = site.config();
    const found = findDeprecations(site.source, deprecations).filter((deprecation) => !engine || deprecation.file !== "_config.yml");
    if (engine) found.push(...engineDeprecations(site, deprecations));
    found.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
    return result(
      found.map((deprecated) => ({
        in: "source",
        file: deprecated.file,
        line: deprecated.line,
        key: deprecated.old,
        message: `is deprecated since ${deprecated.since} and removed in ${deprecated.removed_in}`,
        fix: `rename ${deprecated.old} to ${deprecated.new}`,
        old: deprecated.old,
        new: deprecated.new,
      })),
    );
  },

  "jekyll.liquid-in-content": (site) => {
    const findings = [];
    for (const { path, fm } of pages(site)) {
      if (!isMarkdown(path)) continue;
      const lines = site.read(path).split(/\r?\n/);
      // The body starts after the closing `---`: the front matter's offset, its lines, and the two fences.
      const start = fm.offset ? lines.findIndex((text, index) => index > 0 && /^---\s*$/.test(text)) + 1 : 0;
      const body = lines.slice(start).join("\n");
      let indented = false;
      let previousBlank = true;
      for (const { line, text } of blocks(body).prose) {
        // Indented code: four spaces or a tab after a blank line, until the next unindented line.
        indented = /^( {4}|\t)/.test(text) && (indented || previousBlank);
        previousBlank = !text.trim();
        if (indented) continue;
        const outsideSpans = text.replace(/(`+)(?!`).+?(?<!`)\1(?!`)/g, "");
        const match = /\{\{|\{%/.exec(outsideSpans);
        if (match) {
          findings.push({
            in: "source",
            file: path,
            line: line + start,
            message: `has Liquid (${match[0]}) in the content, which ties it to Jekyll`,
            fix: "move the value to front matter or _data, or put the code in a code block",
          });
        }
      }
    }
    return result(findings);
  },

  "jekyll.translation-pair": (site) => {
    const codes = languages(site);
    if (codes.length < 2) return result([]);
    const fallback = typeof config(site).data.lang === "string" ? config(site).data.lang : "en";
    const byKey = new Map();
    for (const { path, fm } of pages(site)) {
      const key = fm.data.translation_key;
      if (key === undefined || key === null) continue;
      const lang = typeof fm.data.lang === "string" ? fm.data.lang : fallback;
      if (!byKey.has(String(key))) byKey.set(String(key), { first: { path, line: fm.lineOf(["translation_key"]) + fm.offset }, langs: new Set() });
      byKey.get(String(key)).langs.add(lang);
    }
    const findings = [];
    for (const [key, { first, langs }] of byKey) {
      for (const code of codes.filter((code) => !langs.has(code))) {
        findings.push({
          in: "source",
          file: first.path,
          line: first.line,
          key: "translation_key",
          message: `${key} has no page in ${code}`,
          fix: `add a page with lang: ${code} and translation_key: ${key}`,
        });
      }
    }
    return result(findings);
  },

  "jekyll.ui-strings": (site) => {
    const codes = languages(site);
    const files = new Map();
    for (const path of site.files()) {
      const match = /^_data\/i18n\/([^/]+)\.(ya?ml|json)$/i.exec(path);
      if (!match) continue;
      const parsed = site.dataOf(path);
      if (parsed.data && typeof parsed.data === "object") files.set(match[1], { path, ...parsed });
    }
    const has = (code, key) => [code, code.split("-")[0]].some((name) => files.get(name)?.data?.[key] !== undefined);
    const findings = [];
    const seen = new Set();
    for (const { path, data, lineOf } of [...files.values()].sort((a, b) => a.path.localeCompare(b.path))) {
      for (const key of Object.keys(data)) {
        if (builtinKeys.includes(key) || seen.has(key)) continue;
        seen.add(key);
        for (const code of codes.filter((code) => !has(code, key))) {
          findings.push({
            in: "source",
            file: path,
            line: lineOf([key]),
            key,
            message: `has no ${code} text, so ${code} pages show nothing`,
            fix: `add ${key} to _data/i18n/${code}.yml`,
          });
        }
      }
    }
    return result(findings);
  },
};

// The old ids resolve to the check under its new id, but do not run twice: `Object.entries` lists only the new id.
for (const [id, previous] of Object.entries(renamedChecks)) {
  Object.defineProperty(checks, previous, { value: checks[id], enumerable: false });
}
