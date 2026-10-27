import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.sourcemap.present";
export const level = "L0";

export function run(site) {
  if (!site.build) return noOutput;
    const map = site.sourcemap();
    const at = { in: "output", file: "sourcemap.json" };
    if (!map) return failWith([{ ...at, message: "is missing" }]);
    const findings = (map.errors ?? []).map((error) => ({ ...at, ...error }));
    const seen = new Set();
    for (const page of map.data?.pages ?? []) {
      if (typeof page?.url !== "string") continue;
      if (seen.has(page.url)) findings.push({ ...at, key: page.url, message: "this url is listed more than once" });
      seen.add(page.url);
    }
    return failWith(findings);
}
