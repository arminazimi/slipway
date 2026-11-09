## Goal
Compose the chrome into the docs layout at the widths in the design.

## Files

**Create**
- `packages/theme/layouts/doc.ts`
- `packages/theme/layouts/doc.css`
- `packages/theme/test/layout-doc.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. CSS grid; sidebar and table of contents sticky under the header.
2. Skip the layout `h1` when the title came from the body.
3. Mark the article with `data-pagefind-body`.

## Done when
- [ ] `fixtures/docs-site` builds and renders with this layout at 375, 1024, and 1440 px (screenshots in the pull request).
- [ ] `npm run check` passes.
