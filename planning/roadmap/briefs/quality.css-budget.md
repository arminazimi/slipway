## Goal
Sum compressed CSS for the site and fail above 40 KB.

## Files

**Create**
- `tools/css-budget-engine/run.ts`
- `tools/css-budget-engine/run.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Brotli sizes.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
