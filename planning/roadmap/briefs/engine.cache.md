## Goal
Rebuild only what changed: a page whose source, layout, and navigation did not change is reused.

## Files

**Create**
- `packages/engine/src/pipeline/cache.ts`
- `packages/engine/test/cache.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Cache in `.slipway/cache`, keyed by content hashes and engine version.
2. Navigation or config change invalidates all pages.

## Done when
- [ ] A second build of `fixtures/docs-site` with no changes is at least 3 times faster (tested).
- [ ] `npm run check` passes.
