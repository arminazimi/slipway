## Goal
Read the navigation file Slipway 0.2 sites already have, groups, children, and `match` prefixes included.

## Files

**Create**
- `packages/engine/src/nav/from-yaml.ts`
- `packages/engine/test/nav-yaml.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Keep the 0.2 shape: `docs` list, per-language `docs_<lang>` lists.
2. Unknown URLs are diagnostics with the YAML line.

## Done when
- [ ] `fixtures/docs-site` navigation loads with no diagnostics.
- [ ] `npm run check` passes.
