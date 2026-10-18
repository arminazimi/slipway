<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/exports/banner-dark.png">
    <img alt="Slipway: build on Slipway. Ship Seaworthy." src="brand/exports/banner-light.png" width="100%">
  </picture>
</p>

# Slipway

**Build on Slipway. Ship Seaworthy.**

Slipway is an editorial, right-to-left-ready site template for GitHub Pages, built for agents from day one. Every Slipway site is readable by agents, editable by agents, and verified by [Seaworthy](https://github.com/arminazimi/seaworthy) before it ships.

> **Status: planning.** Nothing is installable yet. Work starts on 2026-11-02; see [ROADMAP.md](ROADMAP.md).

## What makes it different

- **Source maps.** Every finding points at the Markdown file and line to edit, not the built HTML.
- **Edit with your agent.** Every section offers a prompt with its source file, line, and current text.
- **WebMCP** (experimental). Every site exposes search and page content as tools to browser agents.
- **Agent-native output.** `llms.txt`, Markdown twins of every page, JSON-LD, and an `AGENTS.md` in every site.
- **Content schemas.** Front matter and `_config.yml` have JSON Schemas, so agents and editors catch mistakes early.
- **Agent Skill and MCP server** for common changes: add a post, add a page, change the theme, verify.
- **Right-to-left done properly.** Persian and Arabic look designed, not mirrored.
- **Verified by default.** Every site passes Seaworthy in CI.
- **Niche starters and migrations.** Starters for academic sites, docs, portfolios, and more; one-command migration from popular themes.

## Planned use

Fork the repository, turn on GitHub Pages, and your site is live with no build step. Power features, such as source maps and verification, run in GitHub Actions.

## Relationship to Seaworthy

Slipway depends on Seaworthy, never the reverse. The deliverables Slipway waits on are listed in [ROADMAP.md](ROADMAP.md#depends-on-seaworthy) and in Seaworthy's [docs/consumers/theme.md](https://github.com/arminazimi/seaworthy/blob/main/docs/consumers/theme.md). Why the two are separate projects: [ADR 0001](docs/adr/0001-why-slipway.md).

## Contributing

Every planned task is a small issue with a lane and a size. Start with [CONTRIBUTING.md](CONTRIBUTING.md). Agents: read [AGENTS.md](AGENTS.md).

## Brand

The mark, palette, badge, favicons, and social art are in [brand/](brand/). Rules for using the name and logo: [brand/USAGE_POLICY.md](brand/USAGE_POLICY.md).

## License

[MIT](LICENSE)
