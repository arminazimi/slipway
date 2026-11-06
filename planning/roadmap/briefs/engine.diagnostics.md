## Goal
Every engine error and warning is a `Diagnostic` with a source position, printed for people or machines.

## Files

**Create**
- `packages/engine/src/pipeline/diagnostics.ts`
- `packages/engine/test/diagnostics.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Collector with `error`, `warn`, and a `hasErrors` flag.
2. Text format `path:line:col  id  message` with a code frame.
3. JSON and SARIF 2.1.0 formatters.

## Done when
- [ ] SARIF output validates against the SARIF schema in a test.
- [ ] `npm run check` passes.
