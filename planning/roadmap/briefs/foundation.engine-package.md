## Goal
Create the engine workspace so every later engine task only adds its own files.

## Files

**Create**
- `packages/engine/package.json`
- `packages/engine/tsconfig.json`
- `packages/engine/README.md`
- `packages/engine/src/index.ts`
- `packages/engine/test/smoke.test.ts`

**Edit**
- `package.json`
- `tools/check.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Package name `@slipway/engine` (temporary; the final name comes when it gets its own repository), `type: module`, `engines.node >=24`, version `0.3.0-dev`.
2. TypeScript settings for type stripping: `erasableSyntaxOnly`, `verbatimModuleSyntax`, `noEmit`, strict.
3. Tests run with `node --test` on `test/**/*.test.ts`; add a `typecheck` script with `tsc --noEmit`.
4. Make `tools/check.mjs` run the engine tests and the type check.
5. Raise the root `engines.node` to `>=24` and add `typescript` as a dev dependency.
6. `src/index.ts` exports nothing yet but a version constant.

## Done when
- [ ] `npm run check` runs the smoke test and the type check.
- [ ] No compile step or build output is committed.
