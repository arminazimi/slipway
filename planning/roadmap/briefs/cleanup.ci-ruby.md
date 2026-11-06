## Goal
Remove Ruby setup and Jekyll builds from every workflow.

## Files

**Edit**
- `.github/workflows/ci.yml`
- `.github/workflows/nightly.yml`
- `.github/workflows/pages-doctor.yml`
- `.github/workflows/release.yml`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Keep jobs' names stable where branch protection requires them, or update the protection in the same change (note it in the pull request).

## Done when
- [ ] `grep -ri ruby .github/workflows` finds nothing.
- [ ] `npm run check` passes.
