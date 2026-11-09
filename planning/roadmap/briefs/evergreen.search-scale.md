## Goal
Prove search is fast at Evergreen's size: the index loads only when search opens and the first result shows quickly.

## Files

**Create**
- `tools/search-scale/run.ts`
- `tools/search-scale/run.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Measure index size and time to first result in Playwright on `fixtures/docs-site`.

## Done when
- [ ] Index under 1 MB, first result under 300 ms including index load on a fast connection.
- [ ] `npm run check` passes.
