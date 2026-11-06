## Goal
Parse code fence meta so code components get structured data instead of strings.

## Files

**Create**
- `packages/engine/src/markdown/plugins/code.ts`
- `packages/engine/test/md-code.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Support ```` ```ts title="a.ts" {1,3-5} ins={2} del={4} ```` and `showLineNumbers`.
2. Adjacent fences inside `:::code-group` become one group with tab labels from titles.
3. Attach the data to the node; do not highlight here.

## Done when
- [ ] Every meta form in `fixtures/docs-site` parses (tested).
- [ ] `npm run check` passes.
