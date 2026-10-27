import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.schemas.described";
export const level = "warning";

export async function run(site) {
  const { fail } = indexOr(site);
    if (fail) return fail;
    const findings = [];
    for (const [ref, { schema }] of await site.schemas()) {
      if (!schema) continue;
      for (const sub of subschemas(schema)) {
        if (!sub.properties || typeof sub.properties !== "object" || Array.isArray(sub.properties)) continue;
        for (const [name, property] of Object.entries(sub.properties)) {
          if (property && typeof property === "object" && !(typeof property.description === "string" && property.description.trim())) {
            findings.push({ in: "source", file: ref, key: name, message: "has no description" });
          }
        }
      }
    }
    return failWith(findings);
}
