## Goal
Turn the Evergreen-shaped example into an engine site and keep it building in CI, as the closest stand-in for Evergreen.

## Files

**Create**
- `examples/product-docs/mizzen.yml`

**Edit**
- `examples/product-docs/index.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Write `mizzen.yml` from `_config.yml` (the migration tool may not exist yet; do it by hand), then delete `_config.yml`.
2. Remove committed generated files (`search.json`, `sitemap.xml`, `sourcemap.json`) that the engine now writes.
3. Keep content and URLs.

## Done when
- [ ] `npx mizzen build examples/product-docs` has zero diagnostics.
- [ ] `npm run check` passes.
