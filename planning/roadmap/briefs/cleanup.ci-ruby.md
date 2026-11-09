## Goal
Remove Ruby setup and Jekyll builds from every workflow. Done: `ci.yml` is Node-only, and the workflows that only built or released the Jekyll site (`nightly`, `pages-doctor`, `release`, and others) are deleted.

## Files

**Edit**
- `.github/workflows/ci.yml`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Keep jobs' names stable where branch protection requires them, or update the protection in the same change (note it in the pull request).

## Done when
- [ ] `grep -ri ruby .github/workflows` finds nothing.
- [ ] `npm run check` passes.
