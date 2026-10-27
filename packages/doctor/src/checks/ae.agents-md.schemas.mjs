import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.agents-md.schemas";
export const level = "L1";

export function run(site) {
  const { fail, text } = agentsOr(site);
    if (fail) return fail;
    const ok = codeSpans(text).some(({ value }) => value === "content-schemas.json");
    return ok ? pass : failWith([agentsFinding("does not name `content-schemas.json` in a code span")]);
}
