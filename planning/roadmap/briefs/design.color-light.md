## Goal
The light palette: background, surface, text, muted, border, accent, and the four callout colors.

## Files

**Create**
- `packages/theme/tokens/color.light.json`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Neutral gray scale of 11 steps and one accent scale.
2. Semantic names (`--sl-color-bg`, `--sl-color-text`, …), not scale names, for use in CSS.
3. Run the token build and commit nothing generated except `tokens.css` if the pipeline says so.

## Done when
- [ ] Values match `docs/design/decisions.md`.
- [ ] `npm run check` passes.
