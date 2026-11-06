## Goal
Images with captions, and an image pair that switches with the theme.

## Files

**Create**
- `packages/theme/components/figure/index.tsx`
- `packages/theme/components/figure/style.css`
- `packages/theme/test/component-figure.test.tsx`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. `width` and `height` set to avoid layout shift; `loading=lazy` below the fold.

## Done when
- [ ] Renders the fixture examples; light, dark, and right-to-left screenshots in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
