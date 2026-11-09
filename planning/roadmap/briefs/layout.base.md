## Goal
The shell every page uses: `<html lang dir>`, head from `Head` data, theme initialization without a flash, a skip link, and header, main, and footer landmarks.

## Files

**Create**
- `packages/theme/layouts/base.ts`
- `packages/theme/test/layout-base.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. A tiny inline script sets `data-theme` before paint from storage or the system setting.
2. Slots for header, sidebar, main, aside, and footer.

## Done when
- [ ] Screenshots in light and dark are in the pull request, compared with `docs/design/mockups/guide.html` once it is approved.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
