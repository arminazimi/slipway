## Goal
MCP server skeleton for Slipway sites.

## Agent brief

**Context**
Agents call tools instead of editing files blindly. This task builds only the server and two read-only tools; `agent.mcp-tools` (Phase 3) adds the editing tools. Use the official TypeScript or JavaScript MCP SDK, stdio transport.

**Steps**
1. Create `packages/mcp/` with `bin/slipway-mcp.mjs` using `@modelcontextprotocol/sdk` pinned to an exact version.
2. Implement tools `list_layouts` (names plus their front-matter schema) and `read_config` (the validated `_config.yml`), both reading from the site directory passed as an argument or `cwd`.
3. Return errors as tool results with `isError`, never crash.
4. Tests: spawn the server over stdio, run `initialize`, `tools/list`, and both tools against `examples/docs`.
5. Document how to register it in Claude Code and Codex configs in `packages/mcp/README.md`.

**Files**
- `packages/mcp/`
- `package.json` (workspaces)

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not add write tools; those come in `agent.mcp-tools`.
- Do not read outside the site directory.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] `tools/list` returns exactly the two tools with JSON Schemas for their inputs.
- [ ] Both tools work on `examples/docs` in a test.
- [ ] A path outside the site is refused.
