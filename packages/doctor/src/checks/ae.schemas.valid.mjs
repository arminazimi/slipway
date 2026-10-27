import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.schemas.valid";
export const level = "L1";

export async function run(site) {
  const { fail, data } = indexOr(site);
    if (fail) return fail;
    const schemas = await site.schemas();
    const findings = [];
    const unsupported = new Set();
    for (const path of site.files()) {
      for (const entry of data.schemas) {
        if (!site.applies(entry, path)) continue;
        const compiled = schemas.get(entry.schema);
        if (!compiled?.validate) continue;
        const parsed = entry.target === "file" ? site.dataOf(path) : site.frontMatterOf(path);
        if (parsed.unsupported) unsupported.add(parsed.unsupported);
        else if (parsed.error) findings.push({ in: "source", file: path, line: parsed.line, key: "/", message: parsed.error });
        else {
          for (const problem of schemaProblems(compiled.validate, parsed.data, parsed.lineOf, parsed.offset)) {
            findings.push({ in: "source", file: path, ...problem });
          }
        }
      }
    }
    findings.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1));
    if (findings.length) return failWith(findings);
    return unsupported.size ? { ...pass, reason: `not checked: ${[...unsupported].join(", ")}` } : pass;
}
