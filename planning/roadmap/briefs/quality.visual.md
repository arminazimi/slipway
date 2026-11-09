## Goal
Screenshot 4 pages at 375, 1024, and 1440 px in light and dark, plus a right-to-left page, and compare with a committed baseline.

## Files

**Create**
- `tools/visual/run.ts`
- `tools/visual/run.test.ts`
- `tools/visual/baseline/`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Disable animations; wait for fonts.
2. Update the baseline only with `--update` and a note in the pull request.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
