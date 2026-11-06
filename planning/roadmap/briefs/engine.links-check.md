## Goal
Fail the build on a link to a missing page or anchor, with the source line of the link.

## Files

**Create**
- `packages/engine/src/model/links.ts`
- `packages/engine/test/links-check.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Use `data-src` positions to report the link's line.
2. `links.ignore` patterns in config.

## Done when
- [ ] A broken link in a temporary copy of a fixture fails with `file:line` (tested).
- [ ] `npm run check` passes.
