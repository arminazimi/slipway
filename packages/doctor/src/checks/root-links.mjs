export const id = "doctor.root-links";
export const level = "warning";

import { blocks, codeSpans } from "../markdown.mjs";

const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

export async function run(site) {
  let baseurl = "";
  for (const name of ["_config.yml", "_config.yaml"]) {
    if (site.isFile(site.source, name)) {
      const configParsed = site.dataOf(name);
      if (configParsed?.data?.baseurl) {
        baseurl = configParsed.data.baseurl;
      }
      break;
    }
  }

  // The issue states: "Report root-relative links in Markdown sources when baseurl is set"
  if (!baseurl) {
    return result([]);
  }

  const findings = [];

  for (const file of site.files(site.source)) {
    if (!file.endsWith(".md") && !file.endsWith(".markdown")) continue;

    const content = site.read(file);
    if (content === null) continue;

    // We want to skip code blocks and inline code
    const mdBlocks = blocks(content);
    // get inline code spans to exclude
    const spans = codeSpans(content);

    for (const { line, text } of mdBlocks.prose) {
      // Find Markdown links [text](/root-relative/path)
      // Exclude those that are inside inline code spans

      const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(text)) !== null) {
        const url = match[2];
        if (url.startsWith("/") && !url.startsWith("//")) {
           // We have a root-relative link

           // Check if it's within a code span
           const matchIndex = match.index;
           const matchEnd = match.index + match[0].length;

           // Simple check: count backticks on the line before the match
           let isInsideCode = false;
           let backticks = 0;
           for (let i = 0; i < matchIndex; i++) {
             if (text[i] === '`') backticks++;
           }
           if (backticks % 2 !== 0) {
             isInsideCode = true;
           }

           if (!isInsideCode) {
              findings.push({
                in: "source",
                file,
                line,
                message: `Root-relative link \`${url}\` will break when \`baseurl\` is set. Use a relative link or \`relative_url\`.`
              });
           }
        }
      }
    }
  }

  return result(findings);
}
