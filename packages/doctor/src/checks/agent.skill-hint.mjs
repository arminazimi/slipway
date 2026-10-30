// The text output's one-line hint: where Slipway's Agent Skills are when a site publishes none.
// The report has no hint field (and JSON and SARIF show only tests and findings), so only the text formatter reads it.
import { Site } from "../site.mjs";

export const id = "agent.skill-hint";

export const hint =
  "hint: no Slipway skill found; install the skills or the plugins from https://github.com/arminazimi/slipway (skills/slipway-site, skills/slipway-content, skills/slipway-doctor; plugins/claude/slipway and plugins/codex/slipway).";

const indexPath = ".well-known/agent-skills/index.json";

/** A site has a skill when its source or output publishes a non-empty index, or AGENTS.md names one. */
export function hasSkill(site) {
  for (const base of [site.build, site.source]) {
    if (!base || !site.isFile(base, indexPath)) continue;
    try {
      const data = JSON.parse(base === site.build ? site.readOutput(indexPath) : site.read(indexPath));
      if (Array.isArray(data?.skills) && data.skills.length > 0) return true;
    } catch {
      // An index that does not parse publishes no usable skill.
    }
  }
  const agents = site.agents();
  return Boolean(agents?.text && /\.well-known\/agent-skills\/|(?:^|[^\w-])skills\/[\w.-]+|slipway-(?:site|content|doctor)\b/.test(agents.text));
}

/** A pass that carries the hint for the text output; it adds no test and no finding to the report. */
export function run(site) {
  return hasSkill(site) ? { status: "pass", findings: [] } : { status: "pass", findings: [], hint };
}

/** The hint for the text output, or null when the site has a skill. `folders` holds `source` and `build`. */
export function hintFor({ source, build }) {
  return run(new Site(source, { build })).hint ?? null;
}
