## Goal
Every MCP tool lives in `packages/mcp/src/tools.mjs` and is wired in `server.mjs`, so two new tools always conflict. Each tool moves to `packages/mcp/src/tools/<name>.mjs` exporting its definition and handler; the server loads the folder; `slipway-mcp --list-tools` prints them.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `packages/mcp/src/tools/<name>.mjs`, one per existing tool
- `packages/mcp/test/registry.test.mjs`

**Edit**
- `packages/mcp/src/server.mjs`
- `packages/mcp/src/tools.mjs` (shared helpers only, or delete)
- `packages/mcp/bin/slipway-mcp.mjs` (`--list-tools`)
- `packages/mcp/README.md` (point at `--list-tools` instead of a hand-kept list)

## Steps
1. Keep every tool name, schema, and output identical.
2. Load tools in sorted order.

## Done when
- [ ] Existing MCP tests pass unchanged.
- [ ] Adding a tool means adding files only.
- [ ] `npm run check` passes.

## Working in parallel
This is a Wave 0 task: it may edit the shared files listed under **Files**, and nothing else shared.

- Do not edit `CHANGELOG.md`. If a site owner would notice the change, add `changelog.d/<this issue number>.md` with one line instead.
- Write temporary builds to the OS temp folder or under `.tmp/`, never to a new top-level folder.
- Keep schema properties and UI string keys in alphabetical order, and add yours at its sorted place.
- If the task needs a file not listed above, stop and explain why in the pull request instead of editing it.

## Run
```bash
npm ci
npm run check
```
