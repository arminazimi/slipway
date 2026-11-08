## Goal
One hash for the whole build in the manifest, and `mizzen verify` to check a built folder against it (Mizzen differentiator 2).

## Files

**Create**
- `packages/engine/src/outputs/build-hash.ts`
- `packages/engine/src/cli/verify.ts`
- `packages/engine/test/output-build-hash.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Hash every output file in a stable order; the manifest records the hash.
2. `mizzen verify <dir> [--hash <hex>]` exits 0 when the folder matches and 1 with the first differing file otherwise.

## Done when
- [ ] Changing one byte in a built fixture makes `mizzen verify` fail and name that file (tested).
- [ ] `npm run check` passes.
