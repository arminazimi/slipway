## Goal
Copy images and other files to the output, with content hashes for theme assets, and copy app-page folders exactly as they are.

## Files

**Create**
- `packages/engine/src/pipeline/assets.ts`
- `packages/engine/test/assets.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Theme assets get hashed names; site assets keep their paths.
2. App pages are byte-for-byte copies.

## Done when
- [ ] The dashboard app page in `fixtures/docs-site` is byte-identical in the output (tested).
- [ ] `npm run check` passes.
