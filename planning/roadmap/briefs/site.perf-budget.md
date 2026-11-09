## Goal
A public page with the performance budget and the real numbers from the gates (Lateen differentiator 8).

## Files

**Create**
- `tools/perf-report/run.ts`
- `tools/perf-report/run.test.ts`
- `site/performance.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Read the JavaScript, CSS, Lighthouse, and build-time gate results.
2. Show each budget next to the measured number.

## Done when
- [ ] `site/performance.md` is generated, and the test fails when it is stale.
- [ ] `npm run check` passes.
