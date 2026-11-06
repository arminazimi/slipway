## Goal
Run the engine's link check on both fixtures in CI and fail on any error.

## Files

**Create**
- `tools/links/run.mjs`
- `tools/links/run.test.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. External links are not checked here.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
