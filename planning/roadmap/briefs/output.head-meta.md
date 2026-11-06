## Goal
Compute each page's `Head` data so layouts only print it.

## Files

**Create**
- `packages/engine/src/outputs/head-meta.ts`
- `packages/engine/test/output-head-meta.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. `TechArticle` JSON-LD for doc pages, `WebSite` for home, `BreadcrumbList` from the trail.
2. `canonical_url` and `description` from front matter win.

## Done when
- [ ] JSON-LD validates against schema.org shapes in a test.
- [ ] `npm run check` passes.
