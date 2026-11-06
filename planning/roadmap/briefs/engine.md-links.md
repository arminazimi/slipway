## Goal
Authors link to source files (`../install.md#step-2`); readers get the page URL.

## Files

**Create**
- `packages/engine/src/markdown/plugins/links.ts`
- `packages/engine/test/md-links.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Resolve relative to the page's source path.
2. Keep the anchor.
3. Leave external links alone; add `rel` for external ones.

## Done when
- [ ] All `.md` links in `fixtures/docs-site` resolve (tested).
- [ ] `npm run check` passes.
