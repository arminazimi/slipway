import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.ts";
import { codeSpans, blocks, headings } from "../markdown.ts";
import { parse, walk, startTags } from "../html.ts";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.ts";

export const id = "ae.agents-md.size";
export const level = "warning";

export function run(site) {
  const agents = site.agents();
    if (!agents) return failWith([agentsFinding("is missing")]);
    return agents.size <= 32768 ? pass : failWith([agentsFinding(`is ${agents.size} bytes, more than 32768`)]);
}
