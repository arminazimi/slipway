An Agent Skill is a folder with a `SKILL.md` that agents load when the task matches its description. Plugins bundle Skills and the MCP server for specific agent platforms.

This issue implements plugins for Claude Code and Codex, bundling the existing `slipway-site`, `slipway-content`, and `slipway-doctor` skills, and the `slipway-mcp` server.

## Context
Claude Code and Codex have different plugin formats:
- Claude Code uses `.claude-plugin/plugin.json` (or just `plugin.json` before submission).
- Codex uses `plugin.toml`.

Both plugins should refer to the skills and MCP server via relative paths to avoid duplicating code.

## Steps
1. Create `plugins/claude/slipway/` and `plugins/codex/slipway/`.
2. Add a `package.json` to each to mark them as private npm workspaces.
3. Configure the Claude Code plugin in `.claude-plugin/plugin.json`.
4. Configure the Codex plugin in `plugin.toml`.
5. Update the root `package.json` to include `plugins/*/*` in `workspaces` and `tools/*.test.mjs` in the `test` script.
6. Add `tools/plugins.test.mjs` to verify the plugins are configured correctly.
7. Update `AGENTS.md` and `CHANGELOG.md`.
