## Goal
Every block element carries its full source span, and the engine can return the span of a block from its ID.

## Files

**Create**
- `packages/engine/src/source/spans.ts`
- `packages/engine/test/source-spans.test.ts`

**Edit**
- `packages/engine/src/contracts/source.ts`
- `schema/sourcemap.schema.json`
- `packages/engine/src/markdown/to-html.ts`
- `packages/engine/src/outputs/sourcemap.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Add `endColumn` to `SourcePos` as ADR 0026 says.
2. Write the span into `data-src` and `sourcemap.json`.
3. Export `spanOf(blockId)` from `spans.ts`.

## Done when
- [ ] For every block of `fixtures/docs-site`, slicing the source file by the span returns exactly that block's Markdown (tested).
- [ ] Two builds give the same IDs and spans.
- [ ] `npm run check` passes.
