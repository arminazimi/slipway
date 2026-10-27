import { splitFrontMatter, allowedFor, parseWithLines } from "../yaml.mjs";
import { codeSpans, blocks, headings } from "../markdown.mjs";
import { parse, walk, startTags } from "../html.mjs";
import { pass, failWith, notRun, agentsFinding, noOutput, agentsOr, sourcemapOr, indexOr, contentFiles, normalize, pathSpans, schemaProblems, subschemas, alnum, inOrder, headingIds, skillsOr, skillFile } from "../utils.mjs";

export const id = "ae.skills.edit";
export const level = "L3";

export function run(site) {
  const { fail, skills } = skillsOr(site);
    if (fail) return fail;
    const ok = skills.some((skill) => {
      const file = skillFile(site, skill?.url);
      if (!file) return false;
      const text = site.readOutput(file);
      return /https:\/\/[^\s)>\]"']+/.test(text) && text.includes("AGENTS.md");
    });
    return ok ? pass : failWith([{ in: "output", file: ".well-known/agent-skills/index.json", message: "no skill gives the source repository's https URL and names AGENTS.md" }]);
}
