import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.schemas.index";
export const level = "L1";

export function run(site) {
  const index = site.index();
    if (!index) return failWith([{ in: "source", file: "content-schemas.json", message: "is missing" }]);
    return failWith((index.errors ?? []).map((error) => ({ in: "source", file: "content-schemas.json", ...error })));
}
