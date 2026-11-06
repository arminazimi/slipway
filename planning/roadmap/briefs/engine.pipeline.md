## Goal
One function runs the whole build and runs every output file found in `src/outputs/`.

## Files

**Create**
- `packages/engine/src/pipeline/build.ts`
- `packages/engine/src/outputs/README.md`
- `packages/engine/test/pipeline.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Outputs are discovered from `src/outputs/*.ts` and run in name order.
2. Write files atomically to the out folder; never leave a half-written site.
3. Stable ordering everywhere so output is deterministic.

## Done when
- [ ] Adding an output file needs no other edit (tested).
- [ ] `npm run check` passes.
