## Goal
Give every heading an ID that stays stable across builds and works for non-Latin text.

## Files

**Create**
- `packages/engine/src/markdown/plugins/slug.ts`
- `packages/engine/test/md-slug.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. github-slugger rules; keep Persian and Arabic letters, remove ZWNJ.
2. `{#custom-id}` at the end of a heading overrides.
3. Duplicates get `-1`, `-2`.

## Done when
- [ ] Persian headings in `fixtures/rtl-site` get readable IDs (tested).
- [ ] `npm run check` passes.
