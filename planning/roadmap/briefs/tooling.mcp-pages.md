## Goal
`move_page` updates navigation and adds a redirect; `scaffold_translation` uses the engine's language rules; `preview` runs `slipway dev`.

## Files

**Edit**
- `packages/mcp/src/tools/move_page.ts`
- `packages/mcp/src/tools/scaffold_translation.ts`
- `packages/mcp/src/tools/preview.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Each tool returns the source files it changed.

## Done when
- [ ] Tests run against `fixtures/docs-site`.
- [ ] `npm run check` passes.
