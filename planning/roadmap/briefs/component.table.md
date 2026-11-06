## Goal
Style Markdown tables and wrap wide ones in a scroll container with a visible edge.

## Files

**Create**
- `packages/theme/components/table/index.tsx`
- `packages/theme/components/table/style.css`
- `packages/theme/test/component-table.test.tsx`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. A rehype step in the component adds the wrapper with `tabindex=0` and a label.

## Done when
- [ ] Renders the fixture examples; light, dark, and right-to-left screenshots in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
