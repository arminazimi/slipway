## Goal
Auto-fixes and deprecation hints use engine config keys.

## Files

**Edit**
- `packages/doctor/src/fix.ts`
- `packages/doctor/src/deprecations.ts`
- `packages/doctor/src/prose.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Add the `_config.yml` → `slipway.yml` key map from ADR 0024 as deprecations.

## Done when
- [ ] Tests run against `fixtures/docs-site`.
- [ ] `npm run check` passes.
