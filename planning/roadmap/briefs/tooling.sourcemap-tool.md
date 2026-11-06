## Goal
`npm run sourcemap` builds with the engine and validates `sourcemap.json`; the Ruby generator goes.

## Files

**Edit**
- `tools/sourcemap/run.mjs`
- `tools/sourcemap/sourcemap.test.mjs`
- `tools/sourcemap/sourcemap.rb`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Delete `tools/sourcemap/sourcemap.rb`.
2. Tests use `fixtures/docs-site`.

## Done when
- [ ] No Ruby file remains in `tools/sourcemap`.
- [ ] `npm run check` passes.
