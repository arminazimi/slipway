## Goal
Before and after the switch, build a fresh checkout of Evergreen's `docs/` with the current engine every night, so an engine change that breaks Evergreen is caught here first.

## Files

**Create**
- `.github/workflows/evergreen-canary.yml`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Check out arminazimi/evergreen read-only; run `slipway migrate --dry-run` before the switch and `slipway build` after it.
2. Open or update one issue on failure (reuse the pattern of the flaky-test report).

## Done when
- [ ] The workflow runs on a schedule and on demand, and a failure opens an issue.
- [ ] `npm run check` passes.
