## Goal
The left column: groups and links from the navigation tree, current page and active section marked, sticky with its own scroll.

## Files

**Create**
- `packages/theme/chrome/sidebar/index.ts`
- `packages/theme/chrome/sidebar/style.css`
- `packages/theme/test/chrome-sidebar.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. `aria-current=page` on the current link, `aria-current=true` on the active section.
2. Large sections render as one link, not every child.

## Done when
- [ ] Screenshots in light and dark are in the pull request, compared with `docs/design/mockups/guide.html` once it is approved.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
