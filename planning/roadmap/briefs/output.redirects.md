## Goal
Write a small HTML page with a meta refresh and canonical link at each old URL.

## Files

**Create**
- `packages/engine/src/outputs/redirects.ts`
- `packages/engine/test/output-redirects.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Read `redirects` in `slipway.yml` and `redirect_from` in front matter.
2. A redirect that hides a real page is an error.

## Done when
- [ ] `npm run check` passes.
