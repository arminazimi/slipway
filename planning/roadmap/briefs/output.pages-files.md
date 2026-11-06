## Goal
Write `.nojekyll` always and `CNAME` when `url` has a custom domain, so the output deploys to GitHub Pages as is.

## Files

**Create**
- `packages/engine/src/outputs/pages-files.ts`
- `packages/engine/test/output-pages-files.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. No `CNAME` for `*.github.io` URLs.

## Done when
- [ ] `npm run check` passes.
