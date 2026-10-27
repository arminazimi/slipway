import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.edit-prompt.source";
export const level = "L2";

export function run(site) {
  const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    const findings = [];
    for (const page of pages) {
      if (!Array.isArray(page.sections) || !page.sections.length) continue;
      const built = headingIds(site, page.url);
      if (!built) continue;
      for (const section of page.sections) {
        const tag = built.ids.get(section.id);
        if (!tag) continue; // ae.sourcemap.ids reports it.
        const expected = `${page.source}:${section.line}`;
        const actual = tag.attributes.get("data-source");
        if (actual !== expected) {
          findings.push({
            in: "output",
            file: built.file,
            key: section.id,
            message: actual === undefined ? `has no data-source (expected ${expected})` : `has data-source ${actual}, expected ${expected}`,
          });
        }
      }
    }
    return failWith(findings);
}
