## Goal
On hover or focus, every block shows "Edit with your agent", which copies a prompt naming the block's exact source span (Lateen differentiator 1).

## Files

**Create**
- `packages/theme/chrome/block-actions/index.ts`
- `packages/theme/chrome/block-actions/style.css`
- `packages/theme/chrome/block-actions/client.ts`
- `packages/theme/test/chrome-block-actions.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Read the span from `data-src`; the prompt names the file, the span, and the block's text.
2. The control starts `hidden` and works without a mouse; pages read fine without JavaScript.
3. Use logical CSS properties so it sits correctly in right-to-left pages.

## Done when
- [ ] Screenshots in light, dark, and right-to-left are in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
