## Goal
The styles every page loads: a small reset and the article typography (headings, paragraphs, lists, links, inline code, blockquotes, horizontal rules, images).

## Files

**Create**
- `packages/theme/styles/base.css`
- `packages/theme/test/base-css.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Tokens only; logical properties only.
2. Headings get scroll margin for the sticky header.
3. Under 8 KB minified.

## Done when
- [ ] A test fails on raw color or length values outside tokens.
- [ ] `npm run check` passes.
