## Goal
Below 768 px, the menu button opens the sidebar in a drawer with a focus trap and Escape to close.

## Files

**Create**
- `packages/theme/chrome/drawer/index.tsx`
- `packages/theme/chrome/drawer/style.css`
- `packages/theme/chrome/drawer/client.ts`
- `packages/theme/test/chrome-drawer.test.tsx`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Use `<dialog>`; reuse the sidebar component inside it.
2. Without JavaScript, the sidebar shows above the article instead.

## Done when
- [ ] Screenshots in light and dark are in the pull request, compared with `docs/design/mockups/guide.html` once it is approved.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
