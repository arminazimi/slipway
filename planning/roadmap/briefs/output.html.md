## Goal
The output that writes each doc page's rendered HTML to `<url>/index.html`.

## Files

**Create**
- `packages/engine/src/outputs/html.ts`
- `packages/engine/test/output-html.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Skip app pages and assets.
2. Respect the base path.

## Done when
- [ ] Every doc page in `fixtures/docs-site` has an `index.html`.
- [ ] `npm run check` passes.
