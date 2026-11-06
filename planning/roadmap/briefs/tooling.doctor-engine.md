## Goal
Teach doctor to detect an engine site (`slipway.yml`) and read the manifest and config instead of Jekyll files.

## Files

**Edit**
- `packages/doctor/src/detect.mjs`
- `packages/doctor/src/site.mjs`
- `packages/doctor/src/doctor.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Detection order: `slipway.yml`, then other generators through adapters (unchanged).
2. Expose pages, sources, and config from the manifest to checks.

## Done when
- [ ] Tests run against `fixtures/docs-site`.
- [ ] `npm run check` passes.
