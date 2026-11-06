## Goal
Delete every starter except `docs`, and move `docs` to the engine.

## Files

**Edit**
- `starters/docs/_config.yml`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Delete `starters/` academic, bilingual, blog, course, garden, handbook, links, newsletter, nonprofit, podcast, portfolio, project, resume, and tool.
2. Convert `starters/docs` with `slipway migrate` (or by hand) to `slipway.yml`.
3. Delete tests and docs that only covered removed starters.

## Done when
- [ ] `starters/` holds only `docs`, which builds with the engine.
- [ ] `npm run check` passes.
