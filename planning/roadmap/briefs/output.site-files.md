## Goal
When the source has its own `sitemap.xml`, `llms.txt`, `llms-full.txt`, or `robots.txt`, copy it and skip the generated one, with no warning.

## Files

**Create**
- `packages/engine/src/outputs/site-files.ts`
- `packages/engine/test/output-site-files.test.ts`

**Edit**
- `packages/engine/src/outputs/README.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Run before the generators; mark which files are owned.
2. Document the rule in the outputs README.

## Done when
- [ ] `fixtures/docs-site`'s own `llms.txt` is the one in the output (tested).
- [ ] `npm run check` passes.
