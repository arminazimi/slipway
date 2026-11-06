## Goal
The right column lists `h2` and `h3` headings of the page; on narrow screens it becomes a collapsible block above the article.

## Files

**Create**
- `packages/theme/chrome/toc/index.tsx`
- `packages/theme/chrome/toc/style.css`
- `packages/theme/test/chrome-toc.test.tsx`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. From the page's `headings`, not by parsing HTML.
2. Hidden when the page has fewer than two headings.

## Done when
- [ ] Screenshots in light and dark are in the pull request, compared with `docs/design/mockups/guide.html` once it is approved.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
