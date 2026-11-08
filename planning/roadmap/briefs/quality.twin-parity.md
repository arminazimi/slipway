## Goal
Prove that each page's Markdown twin says the same thing as its HTML, so agents read what people see (Mizzen differentiator 4).

## Files

**Create**
- `tools/twin-parity/run.mjs`
- `tools/twin-parity/run.test.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Compare the normalized text of each twin with the text of its HTML article, block by block.
2. Name the first page and block that differ.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
