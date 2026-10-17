# 0001. Slipway: a Jekyll-first, agent-native theme that depends on Seaworthy

**Status:** Accepted (2026-10-18).

## Context

Seaworthy began with a reference theme inside its repository. Its [ADR 0009](https://github.com/arminazimi/seaworthy/blob/main/docs/adr/0009-theme-split-and-position.md) moved the theme out: a site builder (Jekyll, Ruby, Liquid) and a verifier (Node, TypeScript) do not belong in one CI matrix, issue tracker, and launch, and a verifier that ships its own theme looks less framework-agnostic.

Research on 2026-10-18 found:

- GitHub Pages themes grow through forks: Minimal Mistakes has about 27,000. Forking is the growth loop, so the template must work as a fork with no build step.
- The most-starred Jekyll themes serve a niche, such as academic sites. A general theme needs niche starters to compete.
- Agent features such as `llms.txt`, a skill file, and an MCP server come built in only with paid, hosted documentation platforms. No free, open-source theme ships them.
- `llms.txt` alone is weak: about 97% of files receive no requests. Agent readiness has to mean more than one file.

## Decision

1. **Slipway is its own project and repository.** It takes over the theme epics, spikes, and tasks from Seaworthy. Their 29 issues are transferred with their history and keep their roadmap keys.
2. **Jekyll first, framework-neutral content.** Jekyll is what GitHub Pages builds without Actions, so a fork is a live site. Content and config do not depend on Jekyll, so an Astro adapter can follow.
3. **Three signature features no theme has:** source maps from findings to Markdown lines, an "Edit with your agent" button with a source-aware prompt, and experimental WebMCP. Around them: `AGENTS.md` in every site, content schemas, an Agent Skill and MCP server, niche starters (academic first), and migration from popular themes.
4. **The dependency points one way.** Slipway depends on Seaworthy through its public contracts only: the CLI, the Action, the badge, the report format, and the specs. Seaworthy never depends on Slipway. Each dependency is listed in [ROADMAP.md](../../ROADMAP.md#depends-on-seaworthy) and in Seaworthy's `docs/consumers/theme.md`, and tasks that wait on one carry the `needs: seaworthy` label.
5. **MIT license**, the norm for themes that are forked and modified.

## Consequences

- Slipway is Seaworthy's first real consumer. Every Slipway pull request runs Seaworthy, so gaps in Seaworthy show up early.
- Until Seaworthy is on npm, Slipway installs it from git pinned to a commit.
- The source-map format is a shared contract: Slipway writes it in its Phase 2 and Seaworthy reads it in its Phase 3, so it is agreed before either side builds on it.
- If Seaworthy slips, Slipway's dependent tasks move, not its core theme. Phases 0 and 1 do not depend on Seaworthy.
