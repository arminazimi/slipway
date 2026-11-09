import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.ts";
import { codeSpans, blocks, headings } from "../markdown.ts";
import { parse, walk, startTags } from "../html.ts";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.ts";

export const id = "ae.edit-prompt.without-script";
export const level = "warning";

export function run(site) {
  if (!site.build) return noOutput;
    const findings = [];
    for (const file of site.outputHtml()) {
      for (const tag of startTags(site.readOutput(file))) {
        if (tag.attributes.has("data-edit-prompt") && !tag.attributes.has("hidden")) {
          findings.push({ in: "output", file, key: tag.name, message: "has data-edit-prompt but is not hidden in the served HTML" });
        }
      }
    }
    return failWith(findings);
}
