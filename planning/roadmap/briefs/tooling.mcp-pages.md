## Goal
`move_page` updates navigation and adds a redirect; `scaffold_translation` uses the engine's language rules; `preview` runs `slipway dev`.

## Files

**Edit**
- `packages/mcp/src/tools/move_page.mjs`
- `packages/mcp/src/tools/scaffold_translation.mjs`
- `packages/mcp/src/tools/preview.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Each tool returns the source files it changed.

## Done when
- [ ] Tests run against `fixtures/docs-site`.
- [ ] `npm run check` passes.
