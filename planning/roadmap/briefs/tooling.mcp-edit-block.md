## Goal
An MCP tool that edits one block by its ID and proves, by rebuilding the page, that nothing outside the block's span changed (Mizzen differentiator 3).

## Files

**Create**
- `packages/mcp/src/tools/edit_block.ts`
- `packages/mcp/test/edit_block.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Inputs: block ID, new Markdown, and the source hash the agent read; refuse when the hash is stale.
2. Replace the span, rebuild the page, and compare every other block; roll back on any difference.
3. Return the changed file, the old and new span, and a diff.

## Done when
- [ ] Tests against `fixtures/docs-site` cover a paragraph, a table, a list item, and a stale-hash refusal.
- [ ] `npm run check` passes.
