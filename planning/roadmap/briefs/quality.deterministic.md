## Goal
Build twice in different temp folders and fail on any byte difference, naming the first differing file.

## Files

**Create**
- `tools/deterministic/run.ts`
- `tools/deterministic/run.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Set a fixed `SOURCE_DATE_EPOCH` for the second build too.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
