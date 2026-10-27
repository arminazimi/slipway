import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.agents-md.paths-exist";
export const level = "L0";

export function run(site) {
  const { fail, text } = agentsOr(site);
    if (fail) return fail;
    const outputs = site.outputNames();
    const findings = [];
    for (const { line, value } of pathSpans(text)) {
      if (/<[^>]+>/.test(value)) continue;
      const path = normalize(value.replace(/:\d+(:\d+)?$/, ""));
      if (!path || outputs.some((name) => path === name || path.startsWith(`${name}/`))) continue;
      const full = site.inside(site.source, path);
      if (!full) findings.push(agentsFinding(`\`${value}\` leaves the source folder`, line));
      else if (!site.files().some((file) => file === path || file.startsWith(`${path}/`)) && !site.isFile(site.source, path)) {
        findings.push(agentsFinding(`\`${value}\` does not exist in the source folder`, line));
      }
    }
    return failWith(findings);
}
