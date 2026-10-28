// Jekyll and Slipway checks. They are not spec tests: a failure is a warning and never changes the level.
// Each check takes the Site and the doctor's options and returns `{ status, findings }`; every finding
// names the file, the line when there is one, and a one-line fix.
import { blocks } from "../markdown.mjs";
import { findDeprecations, packagedDeprecations } from "../deprecations.mjs";
import { detect } from "../detect.mjs";
import * as rootLinks from "./root-links.mjs";

/** The files of starter-files/ in the repository, except its README: every site copies them. */
export const stubs = [".vscode/settings.json", "AGENTS.md"];

/** The keys of _includes/i18n-builtin.html: the theme has English, Persian, Arabic, and Hebrew for each of them. */
export const builtinKeys = [
  "translation_key",
  "skip", "not_found_title", "not_found_text", "go_home", "tags", "categories", "main_nav", "search", "search_none",
  "search_count", "theme", "mode_auto", "mode_light", "mode_dark", "docs_nav", "on_this_page", "previous", "next",
  "pager", "post_pager", "latest_posts", "min_read", "language", "copy", "copy_page_md", "copied", "copy_failed", "edit_label", "edit_prompt",
  "by", "and", "comma", "home", "breadcrumbs", "about_author", "posts", "series", "series_part", "series_pager", "related_posts", "links", "social_links",
];

/** Folders that hold theme code or generated files, not content. */
const notContent = /^(_layouts|_includes|_sass|_data|_site|_drafts|vendor|node_modules)\//;
const isMarkdown = (path) => /\.(md|markdown)$/i.test(path);

/**
 * Whether the checks apply: `detect()` says Jekyll, or the config names a Slipway theme. A site on the
 * remote theme has neither a Gemfile nor `_layouts/`, so detection alone would miss it.
 */
export function applies(site) {
  if (detect(site.source).generator === "jekyll") return true;
  const { data } = config(site);
  return [data.theme, data.remote_theme].some((name) => typeof name === "string" && /slipway/i.test(name));
}

function config(site) {
  for (const name of ["_config.yml", "_config.yaml"]) {
    if (site.isFile(site.source, name)) {
      const parsed = site.dataOf(name);
      return { name, data: parsed.data ?? {}, lineOf: parsed.lineOf ?? (() => 1) };
    }
  }
  return { name: "_config.yml", data: {}, lineOf: () => 1 };
}

/** The language codes the site publishes: `slipway.languages`, else `lang`, else English. */
function languages(site) {
  const { data } = config(site);
  const listed = (data.slipway?.languages ?? []).map((language) => language?.code).filter((code) => typeof code === "string");
  return listed.length ? listed : [typeof data.lang === "string" ? data.lang : "en"];
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

export const checks = {
  [rootLinks.id]: rootLinks.run,
  "jekyll.stubs": (site) =>
    result(
      stubs
        .filter((path) => !site.isFile(site.source, path))
        .map((path) => ({ in: "source", file: path, message: "is missing", fix: `copy starter-files/${path} from the Slipway repository` })),
    ),

  "jekyll.deprecated": (site, { deprecations = packagedDeprecations() } = {}) =>
    result(
      findDeprecations(site.source, deprecations).map((found) => ({
        in: "source",
        file: found.file,
        line: found.line,
        key: found.old,
        message: `is deprecated since ${found.since} and removed in ${found.removed_in}`,
        fix: `rename ${found.old} to ${found.new}`,
        old: found.old,
        new: found.new,
      })),
    ),

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
