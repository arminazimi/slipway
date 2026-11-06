## Goal
A Shiki theme for light mode built from the palette.

## Files

**Create**
- `packages/theme/tokens/code.light.json`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Token colors for keywords, strings, comments, functions, numbers, and diff lines.
2. Every token color meets 4.5:1 on the code background.
3. Run the token build and commit nothing generated except `tokens.css` if the pipeline says so.

## Done when
- [ ] Values match `docs/design/decisions.md`.
- [ ] `npm run check` passes.
