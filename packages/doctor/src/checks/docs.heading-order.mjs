export const id = "docs.heading-order";
export const level = "warning";

import { blocks } from "../markdown.mjs";
import { docsNavigation } from "./docs.description.mjs";

const notContent = /^(_layouts|_includes|_sass|_data|_site|_drafts|vendor|node_modules)\//;
const isMarkdown = (path) => /\.(md|markdown)$/i.test(path);
const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });
const heading = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;

export async function run(site) {
  if (!docsNavigation(site)) return result([]);
  const findings = [];
  for (const path of site.files()) {
    if (notContent.test(path) || !isMarkdown(path)) continue;
    const fm = site.frontMatterOf(path);
    if (!fm?.data || fm.data.layout === "none") continue;
    const lines = site.read(path).split(/\r?\n/);
    // The body starts after the closing front-matter fence, so body lines can map back to file lines.
    const offset = fm.offset ? lines.findIndex((text, index) => index > 0 && /^---\s*$/.test(text)) + 1 : 0;
    const body = lines.slice(offset).join("\n");
    // The layout prints the title as an h1, so the first body heading should be an h2.
    let previous = fm.data.title ? 1 : 0;
    for (const { line, text } of blocks(body).prose) {
      const match = heading.exec(text);
      if (!match) continue;
      const level = match[1].length;
      if (previous && level > previous + 1) {
        findings.push({
          in: "source",
          file: path,
          line: line + offset,
          message: `jumps from an h${previous} to an h${level} heading`,
          fix: `add an h${previous + 1} heading before it, or change this one to h${previous + 1}`,
        });
      }
      previous = level;
    }
  }
  return result(findings);
}
