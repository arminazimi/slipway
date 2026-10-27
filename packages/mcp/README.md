# slipway-mcp

An [MCP](https://modelcontextprotocol.io) server for a Slipway site, so an agent asks the site what it can use instead of guessing from files. It speaks stdio and has these tools:

Run `slipway-mcp --list-tools` for the current tools and what each does. Each tool lives in `src/tools/<name>.mjs`, exporting `definition` and `handler(site, args)`; the server loads the folder in sorted order, so adding a tool means adding files only.

The server serves the site directory given as its first argument, or the current directory. It never reads outside it: a path that leaves the site, directly or through a symlink, is refused. Failures come back as tool results with `isError`, so the server keeps running. Editing tools come later (`agent.mcp-tools` in the [roadmap](../../ROADMAP.md)).

The package is not published yet. Run it from a clone of this repository after `npm ci`.

The [`slipway-doctor` Agent Skill](../../skills/slipway-doctor/SKILL.md) tells an agent when to call `doctor` and how to act on its findings.

## Register it

Claude Code, from the site directory:

```bash
claude mcp add slipway -- node /path/to/slipway/packages/mcp/bin/slipway-mcp.mjs .
```

Or in the site's `.mcp.json`:

```json
{
  "mcpServers": {
    "slipway": {
      "command": "node",
      "args": ["/path/to/slipway/packages/mcp/bin/slipway-mcp.mjs", "."]
    }
  }
}
```

Codex, in `~/.codex/config.toml`:

```toml
[mcp_servers.slipway]
command = "node"
args = ["/path/to/slipway/packages/mcp/bin/slipway-mcp.mjs", "/path/to/your/site"]
```

## Test

`npm test` at the repository root runs `packages/mcp/test/`, which starts the server over stdio and calls each tool on `examples/docs` and the doctor's conforming fixture.
