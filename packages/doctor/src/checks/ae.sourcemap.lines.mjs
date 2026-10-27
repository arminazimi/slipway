import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.sourcemap.lines";
export const level = "L2";

export function run(site) {
  const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    const findings = [];
    for (const page of pages) {
      const at = { in: "output", file: "sourcemap.json", key: String(page.url) };
      if (!Array.isArray(page.sections) || !Array.isArray(page.links)) {
        findings.push({ ...at, message: "has no sections or no links" });
        continue;
      }
      if (typeof page.source !== "string" || !site.isFile(site.source, page.source)) continue;
      const lines = site.read(page.source).split(/\r?\n/);
      const where = (line) => ({ in: "source", file: page.source, line });
      for (const section of page.sections) {
        if (!(section.line <= lines.length)) {
          findings.push({ ...where(section.line), message: `section ${JSON.stringify(section.text)} is past the end of the file` });
          continue;
        }
        const text = alnum(String(section.text ?? ""));
        const here = inOrder(text, alnum(lines[section.line - 1]));
        const before = section.line > 1 && inOrder(text, alnum(lines[section.line - 2]));
        if (!here && !before) findings.push({ ...where(section.line), message: `does not hold section ${JSON.stringify(section.text)}` });
      }
      for (const link of page.links) {
        if (!(link.line <= lines.length) || !lines[link.line - 1].includes(link.href)) {
          findings.push({ ...where(link.line), message: `does not hold link ${JSON.stringify(link.href)}` });
        }
      }
    }
    return failWith(findings);
}
