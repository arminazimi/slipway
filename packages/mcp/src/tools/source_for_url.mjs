import { Site } from "../../../doctor/src/site.mjs";

const notContent = /^(_layouts|_includes|_sass|_data|_site|_drafts|vendor|node_modules)\//;
const isMarkdown = (path) => /\.(md|markdown|html)$/i.test(path);

export const definition = {
  name: "source_for_url",
  description: "Map a URL (and optional anchor) to its source file and line.",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "The URL path from the site root (e.g. /docs/intro.html or /docs/intro/)." },
      anchor: { type: "string", description: "Optional heading id in the built HTML." },
    },
    required: ["url"],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
};

export function sourceForUrl(siteDir, { url, anchor } = {}) {
  if (!url) return {};
  if (url.includes("../") || url.includes("..\\")) return {};

  const site = new Site(siteDir, { build: siteDir });
  const sourcemapResult = site.sourcemap();

  if (sourcemapResult && sourcemapResult.data && Array.isArray(sourcemapResult.data.pages)) {
    const page = sourcemapResult.data.pages.find((p) => p.url === url);
    if (page) {
      if (anchor && Array.isArray(page.sections)) {
        const section = page.sections.find((s) => s.id === anchor);
        if (section) {
          return { file: page.source, line: section.line };
        }
      }
      return { file: page.source, line: 1 };
    }
  }

  for (const path of site.files()) {
    if (notContent.test(path) || !isMarkdown(path)) continue;

    const fm = site.frontMatterOf(path);

    let pageUrl = "/" + path.replace(/\.(md|markdown)$/i, ".html");
    if (pageUrl.endsWith("/index.html")) pageUrl = pageUrl.slice(0, -10);

    if (fm && fm.data && typeof fm.data === "object" && typeof fm.data.permalink === "string") {
      pageUrl = fm.data.permalink;
    }

    if (pageUrl === url) {
      return { file: path, line: 1 };
    }
  }

  return {};
}

export const handler = (site, args) => sourceForUrl(site, args);
