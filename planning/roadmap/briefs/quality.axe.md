## Goal
Run axe on every layout and on one page per component, in light and dark.

## Files

**Create**
- `tools/axe/run.ts`
- `tools/axe/run.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Reuse `@axe-core/playwright`.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
