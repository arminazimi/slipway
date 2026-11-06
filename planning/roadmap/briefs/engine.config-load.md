## Goal
Read `slipway.yml`, apply defaults, validate it against the schema, and report errors with their line in the YAML file.

## Files

**Create**
- `packages/engine/src/config/load.ts`
- `packages/engine/test/config-load.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Parse YAML with positions (the `yaml` package's document API).
2. Validate with Ajv; map each error to a `Diagnostic` with `pos`.
3. Missing file: use defaults and the folder name as title.

## Done when
- [ ] A wrong key reports its line number.
- [ ] `npm run check` passes.
