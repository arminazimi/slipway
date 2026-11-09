## Goal
`unknown-config`, `ae.schemas.config`, and the Jekyll check validate `slipway.yml` with the engine's schema.

## Files

**Edit**
- `packages/doctor/src/checks/unknown-config.ts`
- `packages/doctor/src/checks/ae.schemas.config.ts`
- `packages/doctor/src/checks/jekyll.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Rename the Jekyll check's ID through the deprecation table so old IDs still resolve.
2. Report positions in `slipway.yml`.

## Done when
- [ ] Tests run against `fixtures/docs-site`.
- [ ] `npm run check` passes.
