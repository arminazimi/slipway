## Goal
Write `<url>/index.md` next to each page's HTML so agents can read the source text at the page's URL.

## Files

**Create**
- `packages/engine/src/outputs/twins.ts`
- `packages/engine/test/output-twins.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Same content as `llms-full.txt` uses for the page.
2. Add a link to the twin in the page head (`rel=alternate type=text/markdown`) through `Head` data.

## Done when
- [ ] `npm run check` passes.
