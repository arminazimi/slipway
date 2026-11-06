## Goal
Let a site add behavior from `slipway.config.ts` without forking: hooks from the frozen `plugin.ts` contract.

## Files

**Create**
- `packages/engine/src/plugins/hooks.ts`
- `packages/engine/test/plugins.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Load `slipway.config.ts` if present.
2. Run hooks in plugin order; a throwing hook is a diagnostic naming the plugin.

## Done when
- [ ] A test plugin adds an output file and a page.
- [ ] `npm run check` passes.
