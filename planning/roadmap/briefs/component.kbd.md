## Goal
Style `<kbd>` and `:kbd[Ctrl+K]`, with ⌘ and Ctrl shown per platform when asked.

## Files

**Create**
- `packages/theme/components/kbd/index.tsx`
- `packages/theme/components/kbd/style.css`
- `packages/theme/test/component-kbd.test.tsx`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. No script unless platform switching is used.

## Done when
- [ ] Renders the fixture examples; light, dark, and right-to-left screenshots in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
