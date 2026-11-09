## Goal
`node tools/twins/run.ts` writes the Markdown twins from the engine output. The Jekyll generator was deleted with Ruby; write the tool fresh in TypeScript.

## Files

**Create**
- `tools/twins/run.ts`
- `tools/twins/run.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Build `fixtures/docs-site` with the engine and write one twin per Markdown page (ADR 0006).
2. `run.ts` exports its functions; the test calls them.

## Done when
- [ ] Twins for `fixtures/docs-site` match the pages one to one.
- [ ] `npm run check` passes.
