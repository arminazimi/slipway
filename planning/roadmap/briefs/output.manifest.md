## Goal
Write `.slipway/manifest.json`: every page with URL, source, title, layout, outputs, and hashes, so tools read the build instead of guessing.

## Files

**Create**
- `packages/engine/src/outputs/manifest.ts`
- `packages/engine/test/output-manifest.test.ts`
- `packages/engine/schema/manifest.schema.json`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. A JSON Schema for the manifest.
2. Stable order.

## Done when
- [ ] The manifest validates against its schema.
- [ ] `npm run check` passes.
