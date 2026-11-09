## Goal
`tools/release/prepare.ts` versions and publishes `@slipway/engine` and `@slipway/theme` with npm provenance, alongside the GitHub release. The Jekyll-era `prepare.ts` (gemspec bump) was deleted with Ruby; write the tool fresh in TypeScript.

## Files

**Create**
- `tools/release/prepare.ts`
- `tools/release/prepare.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Same version for both packages in 0.3.0.
2. Dry run by default.
3. Keep folding `changelog.d/` fragments into `CHANGELOG.md` under the new version.

## Done when
- [ ] A dry run prints both packages with the right version.
- [ ] `npm run check` passes.
