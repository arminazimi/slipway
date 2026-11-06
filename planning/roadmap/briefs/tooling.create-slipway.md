## Goal
The starter command asks for a title and repository and writes `slipway.yml`, a `docs/` folder with three sample pages, and the deploy workflow.

## Files

**Edit**
- `packages/create-slipway/src/cli.mjs`
- `packages/create-slipway/src/sources.mjs`
- `packages/create-slipway/src/content-schemas.json`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Only the docs template; remove the other templates' options.
2. The generated site builds in the test.

## Done when
- [ ] Tests run against `fixtures/docs-site`.
- [ ] `npm run check` passes.
