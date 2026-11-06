## Goal
Sum compressed JavaScript each page loads and fail above 30 KB, listing the largest files.

## Files

**Create**
- `tools/js-budget-engine/run.mjs`
- `tools/js-budget-engine/run.test.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Brotli sizes.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
