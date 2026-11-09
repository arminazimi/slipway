import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.ts";
import { codeSpans, blocks, headings } from "../markdown.ts";
import { parse, walk, startTags } from "../html.ts";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.ts";

export const id = "ae.sourcemap.urls-exist";
export const level = "L0";

export function run(site) {
  const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    const findings = pages
      .filter((page) => typeof page.url !== "string" || !site.outputFile(page.url))
      .map((page) => ({ in: "output", file: "sourcemap.json", key: String(page.url), message: "does not resolve to a file in the output folder" }));
    return failWith(findings);
}
