## Goal
One helper that builds `fixtures/docs-site` and `fixtures/rtl-site` with the engine once per run and gives gates the output folder.

## Files

**Create**
- `tools/fixture-build/build.mjs`
- `tools/fixture-build/build.test.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Build into `.tmp/fixture-build/<name>`; reuse when inputs did not change.
2. Export `builtSite(name)`.

## Done when
- [ ] `npm run check` passes.
