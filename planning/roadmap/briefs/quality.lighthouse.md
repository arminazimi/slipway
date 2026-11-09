## Goal
Run Lighthouse on four pages with mobile settings and fail below 95 in any category.

## Files

**Create**
- `tools/lighthouse/run.ts`
- `tools/lighthouse/run.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Serve the build locally; run Lighthouse with Playwright's Chromium.
2. Print the failing audits.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
