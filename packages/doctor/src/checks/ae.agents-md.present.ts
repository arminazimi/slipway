import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.ts";
import { codeSpans, blocks, headings } from "../markdown.ts";
import { parse, walk, startTags } from "../html.ts";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.ts";

export const id = "ae.agents-md.present";
export const level = "L0";

export function run(site) {
  const { fail, text } = agentsOr(site);
    if (fail) return fail;
    return text.trim() ? pass : failWith([agentsFinding("is empty")]);
}
