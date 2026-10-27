import { Site } from "../../../doctor/src/site.mjs";

const notContent = /^(_layouts|_includes|_sass|_data|_site|_drafts|vendor|node_modules)\//;
const isMarkdown = (path) => /\.(md|markdown|html)$/i.test(path);

export const definition = {
  name: "find_text",
  description: "Search content sources and return file, line, and the section heading.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "The text query to search for." },
    },
    required: ["query"],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
};

export function findText(siteDir, { query } = {}) {
  const site = new Site(siteDir);
  const matches = [];

  if (!query) {
    return { matches };
  }

  const lowercaseQuery = query.toLowerCase();

  for (const path of site.files()) {
    if (notContent.test(path) || !isMarkdown(path)) continue;

    const content = site.read(path);
    const lines = content.split(/\r?\n/);
    let currentHeading = null;

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];

      const headingMatch = lineText.match(/^(#{1,6})\s+(.*)/);
      if (headingMatch) {
        currentHeading = headingMatch[2].trim();
      }

      if (lineText.toLowerCase().includes(lowercaseQuery)) {
        matches.push({
          file: path,
          line: i + 1,
          heading: currentHeading,
          match: lineText.trim(),
        });
      }
    }
  }

  return { matches };
}

export const handler = (site, args) => findText(site, args);
