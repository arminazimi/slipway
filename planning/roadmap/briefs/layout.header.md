## Goal
The sticky top bar.

## Files

**Create**
- `packages/theme/chrome/header/index.ts`
- `packages/theme/chrome/header/style.css`
- `packages/theme/test/chrome-header.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Logo and site title from config; repository link icon from `repository`.
2. Collapses to logo, search icon, and menu button on mobile.

## Done when
- [ ] Screenshots in light and dark are in the pull request, compared with `docs/design/mockups/guide.html` once it is approved.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
