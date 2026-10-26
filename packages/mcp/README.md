# slipway-mcp

An [MCP](https://modelcontextprotocol.io) server for a Slipway site, so an agent asks the site what it can use instead of guessing from files. It speaks stdio and has three read-only tools:

| Tool | Input | Returns |
|---|---|---|
| `list_layouts` | none | Every layout the site can use: `name`, `source` (`theme` or `site`, where the site's own `_layouts/` overrides the theme's), `extends` (the parent layout), and `schema`, the JSON Schema of its front matter from `schema/front-matter/` (`null` until a schema exists). |
| `read_config` | `file` (optional, default `_config.yml`) | The parsed config with `valid` and `errors` from [`schema/slipway-config.schema.json`](../../schema/slipway-config.schema.json). |
| `doctor` | `build` (optional, the output folder inside the site, such as `_site`), `level` (optional, `L0` to `L3`) | [`slipway doctor`](../doctor/README.md)'s JSON report on the site, with `ok` and `target` first. `ok` follows the CLI's exit code: true when the site reaches `level`, or with no level when every MUST test passes. It never uses the network. |

The server serves the site directory given as its first argument, or the current directory. It never reads outside it: a path that leaves the site, directly or through a symlink, is refused. Failures come back as tool results with `isError`, so the server keeps running. Editing tools come later (`agent.mcp-tools` in the [roadmap](../../ROADMAP.md)).

Run the server with no install using `npx slipway mcp`.

The [`slipway-doctor` Agent Skill](../../skills/slipway-doctor/SKILL.md) tells an agent when to call `doctor` and how to act on its findings.

## Register it

Claude Code, from the site directory:

```bash
claude mcp add slipway -- npx -y slipway mcp .
```

Or in the site's `.mcp.json`:

```json
{
  "mcpServers": {
    "slipway": {
      "command": "npx",
      "args": ["-y", "slipway", "mcp", "."]
    }
  }
}
```

Codex, in `~/.codex/config.toml`:

```toml
[mcp_servers.slipway]
command = "npx"
args = ["-y", "slipway", "mcp", "/path/to/your/site"]
```

## Test

`npm test` at the repository root runs `packages/mcp/test/`, which starts the server over stdio and calls each tool on `examples/docs` and the doctor's conforming fixture.
