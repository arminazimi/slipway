## Goal
This pull request goes to **arminazimi/evergreen**. Add the doctor Action to Evergreen's CI for `docs/` and record the level reached.

## Files

- `.github/workflows/` (one new job)

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Use `action/doctor` pinned by commit.
2. Fail on errors; report warnings.

## Done when
- [ ] The job runs on Evergreen pull requests and the level is in its README.
