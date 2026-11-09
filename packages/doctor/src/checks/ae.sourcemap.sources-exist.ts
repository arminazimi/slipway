import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.ts";
import { codeSpans, blocks, headings } from "../markdown.ts";
import { parse, walk, startTags } from "../html.ts";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.ts";

export const id = "ae.sourcemap.sources-exist";
export const level = "L0";

export function run(site) {
  const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    const findings = pages
      .filter((page) => typeof page.source !== "string" || !site.isFile(site.source, page.source))
      .map((page) => ({ in: "output", file: "sourcemap.json", key: page.url, message: `source ${JSON.stringify(page.source)} is not a file in the source folder` }));
    return failWith(findings);
}
