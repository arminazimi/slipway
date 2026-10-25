# slipway-mcp

An [MCP](https://modelcontextprotocol.io) server for a Slipway site, so an agent asks the site what it can use instead of guessing from files. It speaks stdio and has two read-only tools:

| Tool | Input | Returns |
|---|---|---|
| `list_layouts` | none | Every layout the site can use: `name`, `source` (`theme` or `site`, where the site's own `_layouts/` overrides the theme's), `extends` (the parent layout), and `schema`, the JSON Schema of its front matter from `schema/front-matter/` (`null` until a schema exists). |
| `read_config` | `file` (optional, default `_config.yml`) | The parsed config with `valid` and `errors` from [`schema/slipway-config.schema.json`](../../schema/slipway-config.schema.json). |

The server serves the site directory given as its first argument, or the current directory. It never reads outside it: a path that leaves the site, directly or through a symlink, is refused. Failures come back as tool results with `isError`, so the server keeps running. Editing tools come later (`agent.mcp-tools` in the [roadmap](../../ROADMAP.md)).

The package is not published yet. Run it from a clone of this repository after `npm ci`.

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

`npm test` at the repository root runs `packages/mcp/test/`, which starts the server over stdio and calls both tools on `examples/docs`.
