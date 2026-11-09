## Goal
A search dialog on Pagefind's JavaScript API: results grouped by section with highlighted excerpts and keyboard navigation.

## Files

**Create**
- `packages/theme/chrome/search/index.ts`
- `packages/theme/chrome/search/style.css`
- `packages/theme/chrome/search/client.ts`
- `packages/theme/test/chrome-search.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Load the index on first open, not on page load.
2. Arrow keys move, Enter opens, Escape closes; the dialog traps focus.
3. Without JavaScript the search button links to a search page or is hidden.

## Done when
- [ ] Results appear in under 100 ms after the index loads on `fixtures/docs-site`.
- [ ] `npm run check` passes.
