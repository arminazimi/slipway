## Goal
A banner from front matter `status`, with `since` and a replacement link for deprecated pages.

## Files

**Create**
- `packages/theme/components/page-status/index.ts`
- `packages/theme/components/page-status/style.css`
- `packages/theme/test/component-page-status.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Rendered by the doc layout above the title when `status` is set.

## Done when
- [ ] Renders the fixture examples; light, dark, and right-to-left screenshots in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
