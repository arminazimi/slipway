import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.schemas.closed";
export const level = "warning";

export async function run(site) {
  const { fail } = indexOr(site);
    if (fail) return fail;
    const findings = [];
    for (const [ref, { schema }] of await site.schemas()) {
      if (!schema || ![schema.type].flat().includes("object")) continue;
      if (schema.additionalProperties !== false && schema.unevaluatedProperties !== false) {
        findings.push({ in: "source", file: ref, message: "accepts unknown keys: set additionalProperties or unevaluatedProperties to false" });
      }
    }
    return failWith(findings);
}
