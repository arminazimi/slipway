## Goal
Static HTML apps pass through untouched and are excluded from every agent and search output.

## Files

**Create**
- `packages/engine/src/outputs/app-pages.ts`
- `packages/engine/test/output-app-pages.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Expose `isAppPage(url)` on the model for other outputs.
2. Add a test that each output skips the dashboard.

## Done when
- [ ] `npm run check` passes.
