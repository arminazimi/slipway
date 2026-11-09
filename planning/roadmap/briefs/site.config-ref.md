## Goal
Generate `site/config.md` from the engine's config schema, with a staleness check.

## Files

**Create**
- `tools/config-ref/run.ts`
- `tools/config-ref/run.test.ts`

**Edit**
- `site/config.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Replace `tools/theme/config-doc.ts` for this page.

## Done when
- [ ] `npm run check` fails when the page is stale.
- [ ] `npm run check` passes.
