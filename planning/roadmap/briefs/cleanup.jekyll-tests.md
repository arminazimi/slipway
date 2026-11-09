## Goal
Delete the tests in `tools/theme/` that build or inspect the Jekyll theme, keeping any helper the new gates still use.

## Files

**Edit**
- `tools/theme/check.ts`
- `tools/check.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. List what each remaining file in `tools/theme/` is used by; delete the unused ones.
2. Remove Jekyll build steps from `tools/check.ts`.

## Done when
- [ ] `tools/theme/` holds no test that needs Jekyll.
- [ ] `npm run check` passes.
