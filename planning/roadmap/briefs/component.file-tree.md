## Goal
Turn a nested list inside `:::file-tree` into a file tree with folder and file icons and highlighted entries.

## Files

**Create**
- `packages/theme/components/file-tree/index.tsx`
- `packages/theme/components/file-tree/style.css`
- `packages/theme/test/component-file-tree.test.tsx`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Comments after `#` render muted.
2. Screen readers get a tree role with levels.

## Done when
- [ ] Renders the fixture examples; light, dark, and right-to-left screenshots in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
