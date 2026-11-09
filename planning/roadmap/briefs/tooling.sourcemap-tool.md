## Goal
`node tools/sourcemap/run.ts` builds with the engine and validates `sourcemap.json`. The Jekyll generator was deleted with Ruby; write the tool fresh in TypeScript.

## Files

**Create**
- `tools/sourcemap/run.ts`
- `tools/sourcemap/run.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Tests use `fixtures/docs-site`.
2. Validate the output with `validateSourcemap` from `tools/theme/sourcemap.mjs`.

## Done when
- [ ] `sourcemap.json` for `fixtures/docs-site` validates.
- [ ] `npm run check` passes.
