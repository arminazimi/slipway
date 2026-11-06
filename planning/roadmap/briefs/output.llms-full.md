## Goal
Write the full text of every doc page in reading order, for agents that want everything at once.

## Files

**Create**
- `packages/engine/src/outputs/llms-full.ts`
- `packages/engine/test/output-llms-full.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Source Markdown with front matter removed and directives kept readable.
2. A header per page with its URL.

## Done when
- [ ] `npm run check` passes.
