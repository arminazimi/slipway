## Goal
Time a cold build of `fixtures/docs-site` and fail above 10 seconds in CI (local runs only warn).

## Files

**Create**
- `tools/build-time/run.ts`
- `tools/build-time/run.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Print a per-stage breakdown from the engine's timing.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
