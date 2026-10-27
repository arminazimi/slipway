import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.agents-md.never";
export const level = "warning";

export function run(site) {
  const { fail, text } = agentsOr(site);
    if (fail) return fail;
    const ok = headings(text).some((heading) => /^(never|do not)\b/i.test(heading.text) && heading.hasList);
    return ok ? pass : failWith([agentsFinding('has no "Never" or "Do not" heading followed by a list')]);
}
