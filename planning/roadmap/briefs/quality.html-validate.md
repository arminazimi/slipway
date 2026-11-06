## Goal
Run html-validate on every built page with the repository's config.

## Files

**Create**
- `tools/html-validate-engine/run.mjs`
- `tools/html-validate-engine/run.test.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Reuse `.htmlvalidate.cjs`.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
