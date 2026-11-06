## Goal
Keep `examples/docs` and `examples/product-docs`; delete `bare`, `blog`, `links`, `minimal`, and `persian` (covered by `fixtures/rtl-site`).

## Files

**Edit**
- `examples/docs/_config.yml`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Convert `examples/docs` to `slipway.yml`.
2. Remove references in tests and CI.

## Done when
- [ ] `npm run check` passes.
