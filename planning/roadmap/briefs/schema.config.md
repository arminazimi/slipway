## Goal
JSON Schema for Slipway's `_config.yml` keys.

## Agent brief

**Context**
`schema/slipway-config.schema.json` exists but covers only part of the config. `tools/theme/config.mjs` and `config-map.mjs` show how keys are read; the schema must describe every key the theme reads.

**Steps**
1. List every `site.*` and `theme.*` key used under `_layouts/` and `_includes/` (grep for `site.` and `site.data`).
2. Complete the schema: type, default, description, enum or pattern, and `additionalProperties: true` for keys that are not Slipway's.
3. Add a test that loads every example's `_config.yml` and validates it with ajv (already a devDependency).
4. Add a test that fails when a key is read in a layout but not in the schema.

**Files**
- `schema/slipway-config.schema.json`
- `tools/theme/config.test.mjs`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not rename or remove existing keys.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] All example configs validate.
- [ ] Adding an undocumented key to a layout fails the test.
- [ ] Every property has a description.
