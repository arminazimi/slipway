## Goal
A section of 500 generated pages shows as one sidebar entry, marks itself active on any of its pages, and does not slow the build.

## Files

**Create**
- `packages/theme/test/large-section.test.tsx`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Test with `fixtures/docs-site/rules/`.
2. Assert the sidebar DOM has fewer than 50 links on a rule page.

## Done when
- [ ] `npm run check` passes.
