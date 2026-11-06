## Goal
Write `llms.txt` following llmstxt.org: title, summary, and sections from the navigation with links to Markdown twins.

## Files

**Create**
- `packages/engine/src/outputs/llms.ts`
- `packages/engine/test/output-llms.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Sections follow navigation groups.
2. Links point to the `.md` twin URLs.

## Done when
- [ ] The file passes the llms.txt format rules (tested).
- [ ] `npm run check` passes.
