## Goal
Write a sitemap of every doc page with `lastmod` when known.

## Files

**Create**
- `packages/engine/src/outputs/sitemap.ts`
- `packages/engine/test/output-sitemap.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Absolute URLs from `url` + base path.
2. Exclude pages with `sitemap: false` and app pages unless listed in config.

## Done when
- [ ] The sitemap validates against the sitemap XSD in a test.
- [ ] `npm run check` passes.
