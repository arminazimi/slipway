## Goal
Spacing on a 4 px grid, radii, two shadows, z-index layers, and the three layout breakpoints.

## Files

**Create**
- `packages/theme/tokens/space.json`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Breakpoints: sidebar appears at 768 px, table of contents at 1280 px (or as decided).
2. Run the token build and commit nothing generated except `tokens.css` if the pipeline says so.

## Done when
- [ ] Values match `docs/design/decisions.md`.
- [ ] `npm run check` passes.
