// Engine-site checks (the `jekyll.*` ids are frozen contracts). They are not spec tests: a failure is a warning and never changes the level.
// Each check takes the Site and the doctor's options and returns `{ status, findings }`; every finding
// names the file, the line when there is one, and a one-line fix.
import { findDeprecations, packagedDeprecations } from "../deprecations.ts";
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

/** Folders that hold theme code or generated files, not content. */
const notContent = /^(_layouts|_includes|_sass|_data|_site|_drafts|vendor|node_modules)\//;

/** Whether the checks apply: only to an engine site, which has a `mizzen.yml` (or `slipway.yml`). */
export function applies(site) {
  return Boolean(site.config());
}

/** The site's config: the engine's config file. */
function config(site) {
  const engine = site.config();
  if (engine?.data && typeof engine.data === "object") {
    return { name: engine.file, data: engine.data, lineOf: engine.lineOf ?? (() => 1) };
  }
  return { name: "mizzen.yml", data: {}, lineOf: () => 1 };
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
  // A setting is reported once, at its deepest mapped key: `slipway.tokens` yields to `slipway.tokens.radius`.
  return found.filter((entry) => !found.some((other) => other.old.startsWith(`${entry.old}.`)));
}

/** Content files with front matter, with their parsed front matter. */
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
    const found = findDeprecations(site.source, deprecations);
    if (site.config()) found.push(...engineDeprecations(site, deprecations));
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
};

// The old ids resolve to the check under its new id, but do not run twice: `Object.entries` lists only the new id.
for (const [id, previous] of Object.entries(renamedChecks)) {
  Object.defineProperty(checks, previous, { value: checks[id], enumerable: false });
}
