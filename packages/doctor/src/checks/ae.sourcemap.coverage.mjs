import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.sourcemap.coverage";
export const level = "warning";

export function run(site) {
  const { fail: indexFail } = indexOr(site);
    if (indexFail) return indexFail;
    const { fail, pages } = sourcemapOr(site);
    if (fail) return fail;
    // Drafts and partials, which publish no page, are learned by detecting the generator (doctor.detect); until then they are listed too.
    const mapped = new Set(pages.map((page) => page.source));
    const entries = site.entries("front-matter");
    const findings = site
      .files()
      .filter((path) => !mapped.has(path) && entries.some((entry) => site.applies(entry, path)))
      .map((path) => ({ in: "source", file: path, message: "matches a front-matter entry but is not a source in sourcemap.json" }));
    return failWith(findings);
}
