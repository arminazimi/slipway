import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.ts";
import { codeSpans, blocks, headings } from "../markdown.ts";
import { parse, walk, startTags } from "../html.ts";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.ts";

export const id = "ae.skills.index";
export const level = "L3";

export function run(site) {
  const { fail, findings } = skillsOr(site);
    return fail ?? failWith(findings);
}
