## Goal
Cards at the end of the article linking to the previous and next pages in reading order.

## Files

**Create**
- `packages/theme/chrome/pager/index.tsx`
- `packages/theme/chrome/pager/style.css`
- `packages/theme/test/chrome-pager.test.tsx`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. `rel=prev` and `rel=next`.
2. Arrows mirror in right-to-left.

## Done when
- [ ] Screenshots in light and dark are in the pull request, compared with `docs/design/mockups/guide.html` once it is approved.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
