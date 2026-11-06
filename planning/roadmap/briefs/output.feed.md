## Goal
Write `changes.xml`: the 30 most recently changed doc pages, so people can follow docs changes.

## Files

**Create**
- `packages/engine/src/outputs/feed.ts`
- `packages/engine/test/output-feed.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Use `last_modified_at` or git dates when available; skip the output when no dates exist.

## Done when
- [ ] `npm run check` passes.
