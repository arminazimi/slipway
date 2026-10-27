import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.schemas.resolve";
export const level = "L1";

export async function run(site) {
  const { fail } = indexOr(site);
    if (fail) return fail;
    const findings = [];
    const skipped = [];
    for (const [ref, result] of await site.schemas()) {
      if (result.error) findings.push({ in: "source", file: "content-schemas.json", key: ref, message: result.error });
      if (result.notRun) skipped.push(result.notRun);
    }
    if (findings.length) return failWith(findings);
    return skipped.length ? { ...pass, reason: `not run: ${skipped.join("; ")}` } : pass;
}
