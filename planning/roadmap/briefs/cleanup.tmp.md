## Goal
Remove leftover build folders from the working tree and make sure they are ignored.

## Files

**Edit**
- `.gitignore`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Delete `.tmp/` and `_site/` if tracked; add both to `.gitignore`.

## Done when
- [ ] `git ls-files .tmp _site` prints nothing.
- [ ] `npm run check` passes.
