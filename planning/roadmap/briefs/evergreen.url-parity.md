## Goal
Given an old `sitemap.xml` and a new build, list every old URL that is missing and not redirected; fail when the list is not empty.

## Files

**Create**
- `tools/url-parity/run.mjs`
- `tools/url-parity/run.test.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Normalize trailing slashes and `index.html`.
2. Accept a URL or a file for the old sitemap.

## Done when
- [ ] Run on `examples/product-docs` against its 0.2 sitemap with zero missing URLs.
- [ ] `npm run check` passes.
