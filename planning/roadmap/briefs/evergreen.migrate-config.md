## Goal
Convert a Slipway 0.2 `_config.yml` into a valid `slipway.yml` using the mapping table in ADR 0024, and report dropped keys.

## Files

**Create**
- `tools/migrate/config.mjs`
- `tools/migrate/config.test.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Keep comments where the key survives.
2. Validate the result with the engine schema.

## Done when
- [ ] Every `_config.yml` under `examples/` and `starters/` converts to a valid file (tested).
- [ ] `npm run check` passes.
