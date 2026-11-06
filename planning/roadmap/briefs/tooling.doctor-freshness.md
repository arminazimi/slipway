## Goal
`twin-fresh`, `sourcemap-fresh`, and `root-links` check the engine's outputs.

## Files

**Edit**
- `packages/doctor/src/checks/twin-fresh.mjs`
- `packages/doctor/src/checks/sourcemap-fresh.mjs`
- `packages/doctor/src/checks/root-links.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Freshness compares source hashes in the manifest.

## Done when
- [ ] Tests run against `fixtures/docs-site`.
- [ ] `npm run check` passes.
