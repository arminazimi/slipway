## Goal
Make `_data/*.yml` and `_data/*.json` available on `site.data`, keyed by file name.

## Files

**Create**
- `packages/engine/src/content/data.ts`
- `packages/engine/test/data.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Nested folders become nested keys.
2. Parse errors are diagnostics with line.

## Done when
- [ ] `npm run check` passes.
