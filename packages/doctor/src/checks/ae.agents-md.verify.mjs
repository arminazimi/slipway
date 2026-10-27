import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.agents-md.verify";
export const level = "warning";

export function run(site) {
  const { fail, text } = agentsOr(site);
    if (fail) return fail;
    const ok = blocks(text).fences.some((block) => ["sh", "bash", "shell"].includes(block.info));
    return ok ? pass : failWith([agentsFinding("has no fenced code block marked sh, bash, or shell")]);
}
