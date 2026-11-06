## Goal
Show shell sessions with prompts and output; copy takes only the commands.

## Files

**Create**
- `packages/theme/components/terminal/index.tsx`
- `packages/theme/components/terminal/style.css`
- `packages/theme/components/terminal/client.ts`
- `packages/theme/test/component-terminal.test.tsx`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Fence language `terminal` or `:::terminal`; lines starting with `$` are commands.

## Done when
- [ ] Renders the fixture examples; light, dark, and right-to-left screenshots in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
