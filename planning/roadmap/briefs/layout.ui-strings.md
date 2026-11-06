## Goal
All chrome text (search, on this page, previous, next, edit, copy, menu, theme names) comes from string files, so right-to-left sites read naturally.

## Files

**Create**
- `packages/theme/i18n/en.json`
- `packages/theme/i18n/fa.json`
- `packages/theme/i18n/ar.json`
- `packages/theme/i18n/index.ts`
- `packages/theme/test/i18n.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Port the existing strings from `_includes/i18n/en.html`, `fa.html`, and `ar.html`.
2. A test fails when a key is missing in a language.

## Done when
- [ ] `npm run check` passes.
