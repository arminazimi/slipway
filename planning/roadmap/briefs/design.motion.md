## Goal
Durations and easings, all zero under `prefers-reduced-motion`.

## Files

**Create**
- `packages/theme/tokens/motion.json`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Three durations, two easings.
2. Run the token build and commit nothing generated except `tokens.css` if the pipeline says so.

## Done when
- [ ] Values match `docs/design/decisions.md`.
- [ ] `npm run check` passes.
