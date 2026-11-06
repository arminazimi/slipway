## Goal
With JavaScript off, check that the article, sidebar, table of contents, pager, and all code blocks are visible and links work.

## Files

**Create**
- `tools/nojs-engine/run.mjs`
- `tools/nojs-engine/run.test.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Playwright with `javaScriptEnabled: false`.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
