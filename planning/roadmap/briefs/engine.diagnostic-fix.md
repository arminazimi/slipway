## Goal
Diagnostics that have a safe, mechanical fix carry it as data (a replacement on a source span), so agents and `mizzen fix` can apply it.

## Files

**Create**
- `docs/adr/0027-diagnostic-fix.md`
- `packages/engine/test/diagnostic-fix.test.ts`

**Edit**
- `docs/adr/README.md`
- `packages/engine/src/contracts/diagnostic.ts`
- `packages/engine/src/pipeline/diagnostics.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. ADR 0027: an optional `fix` with a span and the replacement text; `help` stays for people.
2. Add the field to the contract and print it in the JSON and SARIF formats (SARIF `fixes`).

## Done when
- [ ] A diagnostic with a `fix` round-trips through JSON and validates as SARIF 2.1.0 (tested).
- [ ] `npm run check` passes.
