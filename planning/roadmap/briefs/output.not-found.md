## Goal
Write `404.html` from the `not-found` layout so GitHub Pages and other hosts serve it.

## Files

**Create**
- `packages/engine/src/outputs/not-found.ts`
- `packages/engine/test/output-not-found.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Render with the `not-found` layout if the theme has one, else a plain page.
2. Root-relative asset URLs so it works at any depth.

## Done when
- [ ] `npm run check` passes.
