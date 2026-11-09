import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.ts";
import { codeSpans, blocks, headings } from "../markdown.ts";
import { parse, walk, startTags } from "../html.ts";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.ts";

export const id = "ae.schemas.config";
export const level = "L1";

export function run(site) {
  // Which files a generator reads as configuration is learned by detecting the generator (doctor.detect).
    return notRun("needs generator detection, which this version of slipway doctor does not have");
}
