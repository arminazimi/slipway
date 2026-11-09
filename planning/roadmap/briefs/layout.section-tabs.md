## Goal
Tabs under or in the header for top-level sections (for example Guides and Reference), from navigation items marked `tab: true`.

## Files

**Create**
- `packages/theme/chrome/section-tabs/index.ts`
- `packages/theme/chrome/section-tabs/style.css`
- `packages/theme/test/chrome-section-tabs.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. The active tab follows the active section from the navigation tree.
2. Scrolls horizontally on small screens.

## Done when
- [ ] Screenshots in light and dark are in the pull request, compared with `docs/design/mockups/guide.html` once it is approved.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
