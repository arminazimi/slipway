## Goal
`npx slipway migrate [dir]` runs both steps, writes a report, and changes nothing with `--dry-run`.

## Files

**Create**
- `tools/migrate/run.ts`
- `tools/migrate/README.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. The report lists every changed file and every manual step left.

## Done when
- [ ] A dry run on a copy of `examples/docs` prints a full report (tested).
- [ ] `npm run check` passes.
