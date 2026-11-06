## Goal
Index the built HTML with Pagefind so the search UI can query it with no server.

## Files

**Create**
- `packages/engine/src/outputs/search.ts`
- `packages/engine/test/output-search.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Use Pagefind's Node API on the written pages.
2. Index only the article body (`data-pagefind-body`); add title and section as filters.
3. Language-aware indexing for `fa` pages.
4. `search: false` in config turns it off.

## Done when
- [ ] A query for a rule title returns that rule page first on `fixtures/docs-site` (tested).
- [ ] The index is under 1 MB before compression for 600 pages.
- [ ] `npm run check` passes.
