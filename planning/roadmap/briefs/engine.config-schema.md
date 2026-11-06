## Goal
Describe every `slipway.yml` key from ADR 0024 as a closed JSON Schema so editors, agents, and the loader catch mistakes.

## Files

**Create**
- `packages/engine/schema/config.schema.json`
- `packages/engine/test/config-schema.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Draft 2020-12, `additionalProperties: false`, a `description` on every property.
2. Defaults in the schema match `SiteConfig` defaults.
3. Test valid and invalid samples.

## Done when
- [ ] Every key in `SiteConfig` is in the schema and vice versa (tested).
- [ ] `npm run check` passes.
