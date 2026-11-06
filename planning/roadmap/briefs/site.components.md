## Goal
One page per component with syntax, options, and a live example, replacing `site/blocks/`.

## Files

**Create**
- `site/components/index.md`

**Edit**
- `site/blocks/index.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Create `site/components/<name>.md` for each component in `packages/theme/components/`.
2. Delete `site/blocks/` and redirect its URLs to the new pages.

## Done when
- [ ] Every component folder has a page (tested).
- [ ] `npm run check` passes.
