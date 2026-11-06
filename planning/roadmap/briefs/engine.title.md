## Goal
Pages without a title take it from their first heading; the layout never shows two `h1`s.

## Files

**Create**
- `packages/engine/src/content/title.ts`
- `packages/engine/test/title.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Order: front matter `title`, first `h1`, file name.
2. Mark `titleFromBody` so the layout skips its own `h1`.

## Done when
- [ ] Pages without front matter in `fixtures/docs-site` render one `h1` (tested).
- [ ] `npm run check` passes.
