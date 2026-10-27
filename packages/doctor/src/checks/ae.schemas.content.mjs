import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.schemas.content";
export const level = "L1";

export function run(site) {
  const { fail: indexFail } = indexOr(site);
    if (indexFail) return indexFail;
    const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    const entries = site.entries("front-matter");
    const findings = [];
    for (const source of new Set(pages.map((page) => page.source))) {
      if (typeof source !== "string" || !site.isFile(site.source, source) || !site.frontMatterOf(source)) continue;
      if (!entries.some((entry) => site.applies(entry, source))) {
        findings.push({ in: "source", file: source, message: "has front matter but no front-matter entry in content-schemas.json matches it" });
      }
    }
    return failWith(findings);
}
