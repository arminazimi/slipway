## Goal
A check that fails on `jekyll`, `liquid`, `remote_theme`, `{%`, or `.rb` files outside the allowed places.

## Files

**Create**
- `tools/no-jekyll/run.ts`
- `tools/no-jekyll/run.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Allow: `docs/adr/`, `CHANGELOG.md`, `changelog.d/`, `adapters/`, `tools/migrate/`, `UPGRADING.md`, the migration guide.

## Done when
- [ ] The gate passes on `main` and fails on a planted `.rb` file (tested).
- [ ] `npm run check` passes.
