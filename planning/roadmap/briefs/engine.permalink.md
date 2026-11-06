## Goal
Turn a source path into the page URL using the same rules Slipway 0.2 sites relied on, so URLs do not change on migration.

## Files

**Create**
- `packages/engine/src/content/permalink.ts`
- `packages/engine/test/permalink.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. `a/b.md` → `/a/b/`; `a/index.md` and `a/README.md` → `/a/`.
2. Front matter `permalink` wins.
3. Base path from config for sites in a subpath.

## Done when
- [ ] The URL table of `examples/product-docs` from 0.2 is reproduced (tested).
- [ ] `npm run check` passes.
