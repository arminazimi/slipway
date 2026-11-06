## Goal
Remove `tokens/theme.tokens.json` and point `packages/tokens` at the theme's tokens, or remove it if nothing uses it.

## Files

**Edit**
- `tokens/theme.tokens.json`
- `packages/tokens/package.json`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Check every user of `packages/tokens` first and list them in the pull request.

## Done when
- [ ] `npm run check` passes.
