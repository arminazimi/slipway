## Goal
The trail from the navigation tree above the title.

## Files

**Create**
- `packages/theme/chrome/breadcrumb/index.tsx`
- `packages/theme/chrome/breadcrumb/style.css`
- `packages/theme/test/chrome-breadcrumb.test.tsx`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. `nav` with `aria-label`; the last item is the current page, not a link.
2. Separators mirror in right-to-left.

## Done when
- [ ] Screenshots in light and dark are in the pull request, compared with `docs/design/mockups/guide.html` once it is approved.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
