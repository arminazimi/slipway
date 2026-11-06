## Goal
The dark palette with the same semantic names as light.

## Files

**Create**
- `packages/theme/tokens/color.dark.json`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Near-black background, not pure black.
2. Accent tuned for contrast on dark.
3. Run the token build and commit nothing generated except `tokens.css` if the pipeline says so.

## Done when
- [ ] Values match `docs/design/decisions.md`.
- [ ] `npm run check` passes.
