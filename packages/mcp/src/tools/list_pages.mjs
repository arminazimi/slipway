import { relative, sep } from "node:path";
import { insideSite } from "../tools.mjs";
import { Site } from "../../../doctor/src/site.mjs";

const notContent = /^(_layouts|_includes|_sass|_data|_site|_drafts|vendor|node_modules)\//;
const isMarkdown = (path) => /\.(md|markdown|html)$/i.test(path);

export const definition = {
  name: "list_pages",
  description: "List pages with their URL, source file, layout, language, translation key, and title. Optionally filter by layout, language, or folder.",
  inputSchema: {
    type: "object",
    properties: {
      layout: { type: "string", description: "Filter by layout name." },
      lang: { type: "string", description: "Filter by language code." },
      folder: { type: "string", description: "Filter by folder path relative to the site root." },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
};

function pageUrl(path, fm) {
  if (fm && fm.permalink) return fm.permalink;
  let url = "/" + path.replace(/\.(md|markdown)$/i, ".html");
  if (url.endsWith("/index.html")) url = url.slice(0, -10);
  return url;
}

export function listPages(siteDir, { layout, lang, folder } = {}) {
  let safeFolder = null;
  if (folder) {
    // insideSite throws if it escapes the site folder.
    // It returns the real path, which we can compare.
    const resolved = insideSite(siteDir, folder);
    const siteRoot = insideSite(siteDir, ".");
    safeFolder = relative(siteRoot, resolved).split(sep).join("/");
    if (safeFolder !== "" && !safeFolder.endsWith("/")) safeFolder += "/";
  }

  const site = new Site(siteDir);
  const pages = [];

  for (const path of site.files()) {
    if (notContent.test(path) || !isMarkdown(path)) continue;

    if (safeFolder && safeFolder !== "") {
      if (!path.startsWith(safeFolder)) continue;
    }

    const fm = site.frontMatterOf(path);
    if (!fm || !fm.data || typeof fm.data !== "object") continue;

    if (layout && fm.data.layout !== layout) continue;
    if (lang && fm.data.lang !== lang) continue;

    pages.push({
      url: pageUrl(path, fm.data),
      file: path,
      layout: typeof fm.data.layout === "string" ? fm.data.layout : null,
      lang: typeof fm.data.lang === "string" ? fm.data.lang : null,
      translation_key: typeof fm.data.translation_key === "string" ? fm.data.translation_key : null,
      title: typeof fm.data.title === "string" ? fm.data.title : null,
      line: fm.offset !== undefined ? fm.offset + 1 : 1,
    });
  }

  return { pages };
}

export const handler = (site, args) => listPages(site, args);
