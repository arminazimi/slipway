## Goal
A type scale for long technical reading.

## Files

**Create**
- `packages/theme/tokens/type.json`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. A fluid scale of 7 steps with `clamp()`.
2. Line heights for body, headings, and code; measure 65 to 80 characters.
3. Run the token build and commit nothing generated except `tokens.css` if the pipeline says so.

## Done when
- [ ] Values match `docs/design/decisions.md`.
- [ ] `npm run check` passes.
