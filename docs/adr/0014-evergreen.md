# 0014. Evergreen stays optional: Slipway may use it and offer it to sites, and the dependency points one way

**Status:** Accepted (2026-10-28).

## Context

Slipway's own repository carries the risks its sites carry: a pinned Ruby in `.ruby-version`, Node in CI, the GitHub Pages gem, and a growing set of GitHub Actions. Epic #405 adds dependency lifecycle checks, so end-of-life runtimes, gems, packages, and Actions are found before they break a build. The tool for that is [Evergreen](https://github.com/arminazimi/evergreen), the same maintainer's local-first deprecation scanner: a CLI, a GitHub Action, an MCP server, and an Agent Skill that report deprecated and end-of-life dependencies with the file and line, a replacement, and migration steps.

Evergreen is a sibling project, not a part of Slipway, and it moves on its own calendar. Before any task in the epic lands, the relationship needs the same line [ADR 0011](0011-standalone-and-the-spec.md) draws for Seaworthy, so a tool Slipway dogfoods never becomes a thing a site must install.

## Decision

1. **Slipway may use Evergreen in its own CI.** A lifecycle scan runs against this repository as a regression net, alongside Seaworthy, pinned to a version.
2. **Sites may opt in; no site needs it.** Slipway can offer Evergreen to sites as an optional extra: a workflow file a site copies, pointers in the docs, the skills, and the doctor's advice. Nothing a site needs may depend on Evergreen — the same rule ADR 0011 sets for Seaworthy. A site builds, passes `slipway doctor`, and ships with Evergreen absent.
3. **The dependency points one way.** Slipway consumes only Evergreen's public contracts: the CLI, the GitHub Action, the report format, and the skill and MCP entry points. Evergreen never depends on Slipway. Never copy its code.

## Consequences

- Evergreen is wired like the other optional tools: a check that wants it prints `SKIP` with a notice when it is missing, the way the browser steps do without Playwright.
- No layout, check, level, or build step reads an Evergreen finding. A site without Evergreen sees no difference in output, and no Slipway check turns red because it is not installed.
- The doctor may name Evergreen in advisory text, but its findings never change the level a site reaches; checks that are not about editing stay out of the doctor (ADR 0011).
- Slipway is Evergreen's consumer the way it is Seaworthy's: gaps in Evergreen show up early, in Slipway's own CI.
- If Evergreen slips or changes, Slipway's roadmap tasks wait, not its theme. No phase depends on an Evergreen release.
