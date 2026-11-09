## Goal
A link icon after each `h2` to `h4` that links to the heading.

## Files

**Create**
- `packages/theme/components/heading-anchor/index.ts`
- `packages/theme/components/heading-anchor/style.css`
- `packages/theme/test/component-heading-anchor.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. The icon is not part of the heading's accessible name.
2. Shown on hover and focus; always on touch.

## Done when
- [ ] Renders the fixture examples; light, dark, and right-to-left screenshots in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
