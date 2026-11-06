## Goal
Persian and Arabic pages look designed: their own font stack, line height, no letter spacing, and code that stays left-to-right inside right-to-left text.

## Files

**Create**
- `packages/theme/tokens/rtl.json`
- `packages/theme/styles/rtl.css`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. `:lang(fa)`, `:lang(ar)` selectors; logical properties only.
2. `pre`, `code`, and `kbd` get `direction: ltr; unicode-bidi: isolate`.

## Done when
- [ ] `fixtures/rtl-site` pages render with Vazirmatn and left-to-right code (screenshot in the pull request).
- [ ] `npm run check` passes.
