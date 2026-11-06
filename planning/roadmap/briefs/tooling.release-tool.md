## Goal
`tools/release/prepare.mjs` versions and publishes `@slipway/engine` and `@slipway/theme` with npm provenance, alongside the GitHub release.

## Files

**Edit**
- `tools/release/prepare.mjs`
- `tools/release/prepare.test.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Same version for both packages in 0.3.0.
2. Dry run by default.

## Done when
- [ ] A dry run prints both packages with the right version.
- [ ] `npm run check` passes.
