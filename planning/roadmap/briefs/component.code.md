## Goal
Render code fences with Shiki at build time using the light and dark code themes, so no highlighting runs in the browser.

## Files

**Create**
- `packages/theme/components/code/index.tsx`
- `packages/theme/components/code/style.css`
- `packages/theme/test/component-code.test.tsx`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Read the Shiki themes from `packages/theme/tokens/code.light.json` and `code.dark.json` when present, else the placeholders in `names.json`.
2. Dual themes through CSS variables so the theme switch needs no rebuild.
3. Load only the grammars used on the site.
4. Keep `data-src` on the `pre`.
5. Horizontal scroll inside the block, never the page.

## Done when
- [ ] Renders the fixture examples; light, dark, and right-to-left screenshots in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
