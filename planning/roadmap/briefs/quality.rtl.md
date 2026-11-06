## Goal
On `fixtures/rtl-site`, check `dir=rtl`, code blocks left-to-right, mirrored directional icons, and no physical CSS properties in theme CSS.

## Files

**Create**
- `tools/rtl/run.mjs`
- `tools/rtl/run.test.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Reuse the logical-CSS rule from `tools/theme/logical-css.mjs` against `packages/theme`.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
