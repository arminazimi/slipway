## Goal
Build the `Site` value every output and layout reads: config, pages, navigation, and data, in deterministic order.

## Files

**Create**
- `packages/engine/src/model/build.ts`
- `packages/engine/test/model.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Run discovery, then each page through front matter, Markdown, title, permalink, and language.
2. Duplicate URLs are errors with both sources.
3. Expose `buildModel(root): Promise<{ site, diagnostics }>`.

## Done when
- [ ] `fixtures/docs-site` builds a model with about 600 pages and zero errors.
- [ ] `npm run check` passes.
