## Goal
These commands read `slipway.yml`; `pin` pins the npm package version instead of `remote_theme`.

## Files

**Edit**
- `packages/doctor/src/commands/info.mjs`
- `packages/doctor/src/commands/pin.mjs`
- `packages/doctor/src/commands/translate.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. `translate` scaffolds `/fa/` pages using the engine's language rules.

## Done when
- [ ] Tests run against `fixtures/docs-site`.
- [ ] `npm run check` passes.
