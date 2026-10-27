import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.agents-md.layout";
export const level = "L0";

export function run(site) {
  const { fail, text } = agentsOr(site);
    if (fail) return fail;
    const spans = codeSpans(text).map(({ value }) => normalize(value));
    const content = contentFiles(site);
    const findings = [];
    const namesContent = spans.some((span) => span && content.some((file) => file === span || file.startsWith(`${span}/`)));
    if (!namesContent) findings.push(agentsFinding("names no folder or file that holds content in a code span"));
    if (!site.build) {
      return findings.length ? failWith(findings) : { ...pass, reason: "the output folder part needs --build <dir>" };
    }
    const names = site.outputNames();
    if (!spans.some((span) => names.includes(span))) {
      findings.push(agentsFinding(`does not name the output folder in a code span (expected \`${names[0]}/\`)`));
    }
    return failWith(findings);
}
