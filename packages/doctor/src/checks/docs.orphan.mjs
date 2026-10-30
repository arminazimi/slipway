export const id = "docs.orphan";
export const level = "warning";

import { docsNavigation } from "./docs.description.mjs";

const notContent = /^(_layouts|_includes|_sass|_data|_site|_drafts|vendor|node_modules)\//;
const isMarkdown = (path) => /\.(md|markdown)$/i.test(path);
const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

/** A URL as pages write it: no host, query, or hash, one leading slash, and one trailing slash. */
function url(target) {
  let value = String(target).trim().replace(/^[a-z]+:\/\/[^/]+/i, "").replace(/[?#].*$/, "");
  if (!value.startsWith("/")) value = "/" + value;
  value = value.replace(/\/index\.html?$/, "/").replace(/\.html?$/, "/");
  return value.endsWith("/") ? value : value + "/";
}

/** Every URL a site links to: Markdown links, HTML links, and the docs navigation. */
function links(site, pages) {
  const found = new Set();
  const add = (target) => {
    if (typeof target !== "string" || !target.trim() || /^(?:[a-z]+:|#)/i.test(target.trim())) return;
    found.add(url(target));
  };
  const walk = (value) => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") {
      add(value.url);
      Object.values(value).forEach(walk);
    }
  };
  walk(docsNavigation(site));
  for (const path of pages) {
    const text = site.read(path);
    for (const match of text.matchAll(/\]\(\s*<?([^)\s>]+)/g)) add(match[1]);
    for (const match of text.matchAll(/\bhref="([^"]+)"/g)) add(match[1]);
  }
  return found;
}

export async function run(site) {
  if (!docsNavigation(site)) return result([]);
  const scanned = [];
  const pages = [];
  for (const path of site.files()) {
    if (notContent.test(path) || !isMarkdown(path)) continue;
    const fm = site.frontMatterOf(path);
    if (!fm?.data || fm.data.layout === "none" || fm.data.published === false) continue;
    scanned.push(path);
    if (/(^|\/)index\.(md|markdown)$/i.test(path) || /(^|\/)404\.(md|markdown)$/i.test(path)) continue;
    pages.push({ path, fm });
  }
  const found = links(site, scanned);
  const findings = [];
  for (const { path, fm } of pages) {
    const stem = path.replace(/\.(md|markdown)$/i, "");
    const base = stem.split("/").pop();
    const candidates = new Set([url(path), url(stem + "/"), url(stem + ".html"), url(base + "/")]);
    if (typeof fm.data.permalink === "string") candidates.add(url(fm.data.permalink));
    if (![...candidates].some((candidate) => found.has(candidate))) {
      findings.push({
        in: "source",
        file: path,
        message: "is not linked from another page or the docs navigation",
        fix: "add a link to it from a page or the navigation, or delete it",
      });
    }
  }
  return result(findings);
}
