## Goal
Group fences under `:::code-group` into accessible tabs.

## Files

**Create**
- `packages/theme/components/code-tabs/index.ts`
- `packages/theme/components/code-tabs/style.css`
- `packages/theme/components/code-tabs/client.ts`
- `packages/theme/test/component-code-tabs.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. WAI-ARIA tabs pattern with arrow keys.
2. Without JavaScript, all blocks show stacked with their titles.

## Done when
- [ ] Renders the fixture examples; light, dark, and right-to-left screenshots in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
