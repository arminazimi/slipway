## Goal
Write the source map the spec defines: for every page and block, the source file and line, built from the positions the engine kept.

## Files

**Create**
- `packages/engine/src/outputs/sourcemap.ts`
- `packages/engine/test/output-sourcemap.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Match `schema/sourcemap.schema.json` exactly; do not change the schema.
2. IDs match the `data-src` attributes in the HTML.
3. Paths are relative to the repository root, so sites in a `docs/` subfolder work.

## Done when
- [ ] The output validates against the schema for `fixtures/docs-site`.
- [ ] For every page, each entry's line equals the `data-src` line in the HTML (tested).
- [ ] `npm run check` passes.
