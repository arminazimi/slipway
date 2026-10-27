> [!IMPORTANT]
> This pull request goes to **arminazimi/evergreen**, not to Slipway. Link it here with `Closes arminazimi/slipway#<this issue>`.

## Goal
Evergreen's pull requests show `slipway doctor` findings on its documentation, so a docs change that breaks the site fails review.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- a job in Evergreen's workflow that runs `arminazimi/slipway/action/doctor@v0.2.0` on `docs/` (pinned to the tag's commit SHA)

**Edit**
- docs/README or the docs contributing section: how to run `npx slipway doctor docs` locally

## Steps
1. Start report-only; switch to failing on errors once the site is clean.
2. Record the reached level in this issue, and file a Slipway issue for every finding that is Slipway's fault.

## Done when
- [ ] The job runs on every pull request that touches `docs/`.
- [ ] The reached level is recorded here.
