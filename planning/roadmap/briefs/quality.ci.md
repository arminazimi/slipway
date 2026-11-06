## Goal
Put the browser-based gates in one cached CI job so the main job stays fast.

## Files

**Edit**
- `.github/workflows/ci.yml`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Cache Playwright browsers (the existing cache step).
2. Upload screenshots and Lighthouse reports as artifacts on failure.

## Done when
- [ ] The job runs on pull requests and shows each gate as a step.
- [ ] `npm run check` passes.
