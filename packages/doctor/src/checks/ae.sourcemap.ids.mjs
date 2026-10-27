import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.sourcemap.ids";
export const level = "L2";

export function run(site) {
  const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    const findings = [];
    for (const page of pages) {
      if (!Array.isArray(page.sections) || !page.sections.length) continue;
      const built = headingIds(site, page.url);
      if (!built) continue; // ae.sourcemap.urls-exist reports it.
      for (const section of page.sections) {
        const tag = built.ids.get(section.id);
        const at = { in: "output", file: built.file, key: section.id };
        if (!tag || !/^h[1-6]$/.test(tag.name)) findings.push({ ...at, message: "no heading has this id" });
        else if (tag.name !== `h${section.level}`) findings.push({ ...at, message: `is an ${tag.name}, the map says h${section.level}` });
      }
    }
    return failWith(findings);
}
