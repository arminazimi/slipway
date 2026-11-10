import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.ts";
import { codeSpans, blocks, headings } from "../markdown.ts";
import { parse, walk, startTags } from "../html.ts";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.ts";

export const id = "ae.schemas.config";
export const level = "L1";

/** The configuration files the detected generator reads: the engine's config; other generators' are not reported yet. */
function configFiles(site) {
  const engine = site.config();
  return engine ? [engine.file] : [];
}

export function run(site) {
  const { fail, data } = indexOr(site);
  if (fail) return fail;
  const entries = (data.schemas ?? []).filter((entry) => entry.target === "file");
  const findings = [];
  for (const file of configFiles(site)) {
    if (!entries.some((entry) => site.applies(entry, file))) {
      findings.push({
        in: "source",
        file,
        line: 1,
        message: 'is a configuration file the generator reads, but no `target: "file"` entry in content-schemas.json matches it',
      });
    }
  }
  return failWith(findings);
}
