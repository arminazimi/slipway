## Goal
A three-state switch that sets `data-theme` and remembers the choice.

## Files

**Create**
- `packages/theme/chrome/theme-toggle/index.ts`
- `packages/theme/chrome/theme-toggle/style.css`
- `packages/theme/chrome/theme-toggle/client.ts`
- `packages/theme/test/chrome-theme-toggle.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Storage in try/catch; system is the default.
2. Announce the change to screen readers.

## Done when
- [ ] Screenshots in light and dark are in the pull request, compared with `docs/design/mockups/guide.html` once it is approved.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
