## Goal
A command line that builds a site or only checks it, with diagnostics in text, JSON, or SARIF.

## Files

**Create**
- `packages/engine/src/cli/index.ts`
- `packages/engine/bin/slipway.ts`
- `packages/engine/test/cli.test.ts`

**Edit**
- `packages/engine/package.json`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. `slipway build [dir] --out dist`, `slipway check [dir] --format text|json|sarif`.
2. Exit codes: 0 ok, 1 errors, 2 usage.
3. Add the `bin` entry to the engine's `package.json`.

## Done when
- [ ] `npx slipway build fixtures/docs-site` works from the repository root.
- [ ] `npm run check` passes.
