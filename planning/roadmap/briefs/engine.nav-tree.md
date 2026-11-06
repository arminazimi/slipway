## Goal
From a navigation tree and a page URL, compute everything the chrome needs: which item is current, which section is active (prefix `match`), the breadcrumb trail, and previous and next pages.

## Files

**Create**
- `packages/engine/src/nav/tree.ts`
- `packages/engine/test/nav-tree.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Pages under a `match` prefix mark that item active, not every child (large sections).
2. Pager follows reading order of leaves.

## Done when
- [ ] A generated rule page marks the `rules` section, not 500 items (tested).
- [ ] `npm run check` passes.
