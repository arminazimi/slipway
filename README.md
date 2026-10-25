<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/exports/banner-dark.png">
    <img alt="Slipway: build on Slipway. Ship Seaworthy." src="brand/exports/banner-light.png" width="100%">
  </picture>
</p>

# Slipway

**Build on Slipway. Ship Seaworthy.**

Sites that agents can edit safely, and prove it. Slipway is two things:

- **A theme.** An editorial, right-to-left-ready theme for GitHub Pages that works on its own in any project, with one line of config.
- **An open spec and its checker.** The agent-editable site spec says what a site publishes so an agent can edit it safely; `slipway doctor` checks any static site against it, whatever generator built it.

The theme is the spec's reference implementation: a site built with it reaches the top level.

> **Status: alpha.** The core theme works (layouts, tokens, right-to-left, search, feeds). `1.0.0`, the first stable release, is planned for 2027-02-14; see [ROADMAP.md](ROADMAP.md).

## What makes it different

- **Source maps.** Every finding points at the Markdown file and line to edit, not the built HTML.
- **Edit with your agent.** Every section offers a prompt with its source file, line, and current text.
- **`slipway doctor`.** Checks any static site against the agent-editable spec, with findings on the source line, as JSON and SARIF, in a GitHub Action, and as an MCP tool.
- **WebMCP** (experimental). Every site exposes search and page content as tools to browser agents.
- **Agent-native output.** `llms.txt`, Markdown twins of every page, JSON-LD, and an `AGENTS.md` in every site.
- **Content schemas.** Front matter and `_config.yml` have JSON Schemas, so agents and editors catch mistakes early.
- **Agent Skill and MCP server** for common changes: add a post, add a page, change the theme, verify.
- **Right-to-left done properly.** Persian and Arabic look designed, not mirrored.
- **Stable by contract.** The public API follows semver; renamed keys warn before they break.
- **Niche starters and migrations.** Starters for academic sites, docs, portfolios, and more; one-command migration from popular themes.

## Planned use

Add `remote_theme: arminazimi/slipway` to your `_config.yml`, or fork the repository and turn on GitHub Pages: your site is live with no build step. Pinned releases, a gem, and `npx create-slipway` arrive in Phase 2. Power features, such as exact-line source maps, run in GitHub Actions. See [the two modes](docs/modes.md) for what each feature needs. To add a snippet, a footer line, or your own CSS without forking, use the [override slots](docs/overrides.md).

## Relationship to Seaworthy

Slipway works without [Seaworthy](https://github.com/arminazimi/seaworthy) and integrates with it after 1.0. Seaworthy asks "is this site healthy and readable by agents?"; Slipway's spec asks "can an agent edit this site safely?". The integration plan is in [ROADMAP.md](ROADMAP.md#slipway-and-seaworthy). Why the two are separate projects: [ADR 0001](docs/adr/0001-why-slipway.md); why 1.0 is standalone: [ADR 0011](docs/adr/0011-standalone-and-the-spec.md). What a site may rely on across versions: [ADR 0012](docs/adr/0012-public-api.md).

## Contributing

Every planned task is a small issue with a lane and a size. Start with [CONTRIBUTING.md](CONTRIBUTING.md). Agents: read [AGENTS.md](AGENTS.md).

## Brand

The mark, palette, badge, favicons, and social art are in [brand/](brand/). Rules for using the name and logo: [brand/USAGE_POLICY.md](brand/USAGE_POLICY.md).

## License

[MIT](LICENSE)
