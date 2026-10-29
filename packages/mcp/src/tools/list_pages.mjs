import { Site } from "../../../doctor/src/site.mjs";
import { insideSite } from "../tools.mjs";

const notContent = /^(_layouts|_includes|_sass|_data|_site|_drafts|vendor|node_modules)\//;
const isMarkdown = (path) => /\.(md|markdown|html)$/i.test(path);

export const definition = {
  name: "list_pages",
  description: "List pages with URL, source path, layout, lang, translation_key, and title.",
  inputSchema: {
    type: "object",
    properties: {
      folder: { type: "string", description: "Filter pages to only those inside this folder relative to the site directory." },
      layout: { type: "string", description: "Filter pages by layout name." },
      lang: { type: "string", description: "Filter pages by language code." },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
};

export function listPages(siteDir, { folder, layout, lang } = {}) {
  const site = new Site(siteDir, { build: siteDir });

  if (folder) {
    insideSite(siteDir, folder);
  }

  const pages = [];

  for (const path of site.files()) {
    if (notContent.test(path) || !isMarkdown(path)) continue;

    if (folder && !path.startsWith(folder.replace(/^\/+|\/+$/g, '') + '/') && path !== folder.replace(/^\/+|\/+$/g, '')) continue;

    const fm = site.frontMatterOf(path);
    const data = fm && fm.data ? fm.data : {};

    if (layout && data.layout !== layout) continue;
    if (lang && data.lang !== lang) continue;

    let pageUrl = "/" + path.replace(/\.(md|markdown)$/i, ".html");
    if (pageUrl.endsWith("/index.html")) pageUrl = pageUrl.slice(0, -10) || "/";

    if (typeof data.permalink === "string") {
      pageUrl = data.permalink;
    }

    pages.push({
      url: pageUrl,
      source: path,
      layout: data.layout || null,
      lang: data.lang || null,
      translation_key: data.translation_key || null,
      title: data.title || null,
    });
  }

  return { pages };
}

export const handler = (site, args) => listPages(site, args);
