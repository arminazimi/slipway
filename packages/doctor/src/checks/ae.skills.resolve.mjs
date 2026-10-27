import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.skills.resolve";
export const level = "L3";

export function run(site) {
  const { fail, skills } = skillsOr(site);
    if (fail) return fail;
    const findings = [];
    skills.forEach((skill, i) => {
      const at = { in: "output", file: ".well-known/agent-skills/index.json", key: `skills.${i}.url` };
      const file = skillFile(site, skill?.url);
      if (!file) return findings.push({ ...at, message: `${JSON.stringify(skill?.url)} does not resolve to a file on the same site` });
      const block = splitFrontMatter(site.readOutput(file));
      const parsed = block?.format === "yaml" ? parseWithLines(block.text) : null;
      const data = parsed?.data ?? {};
      if (data.name !== skill.name) findings.push({ in: "output", file, key: "name", message: `is ${JSON.stringify(data.name)}, the index says ${JSON.stringify(skill.name)}` });
      if (!(typeof data.description === "string" && data.description.trim())) findings.push({ in: "output", file, key: "description", message: "is missing or empty" });
    });
    return failWith(findings);
}
