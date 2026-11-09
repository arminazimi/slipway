## Goal
The scaffolding commands write `slipway.yml`, a `docs/` folder, and the deploy workflow instead of Jekyll files.

## Files

**Edit**
- `packages/doctor/src/commands/new.ts`
- `packages/doctor/src/commands/stubs.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. `stubs` writes nothing for outputs the engine now generates; print that it is not needed.

## Done when
- [ ] Tests run against `fixtures/docs-site`.
- [ ] `npm run check` passes.
