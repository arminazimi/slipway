## Goal
Fail when `packages/engine` imports from `packages/theme`, or contains Slipway names, theme colors, or layout names.

## Files

**Create**
- `tools/engine-boundary/run.ts`
- `tools/engine-boundary/run.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Scan imports with a TypeScript-aware regex; scan strings for a deny list.
2. Allow the word Slipway only in `package.json` and README until the engine is renamed.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
