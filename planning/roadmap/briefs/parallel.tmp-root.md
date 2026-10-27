## Goal
Every test that builds a site adds its own `.tmp-<name>/` line to `.gitignore`, so two tests added in parallel conflict there. All temporary output moves under `.tmp/<name>/`.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/theme/tmp.mjs` (a helper returning `.tmp/<name>` and cleaning it)

**Edit**
- `tools/**/*.test.mjs` and adapters/*/test/*.test.mjs that write `.tmp-*` folders
- `.gitignore`

## Steps
1. Replace each `.tmp-<name>` path with the helper.
2. Remove the `.tmp-*` lines from `.gitignore` and add `.tmp/`.

## Done when
- [ ] No test writes outside `.tmp/`, `_site/`, or the OS temp folder.
- [ ] `.gitignore` has no `.tmp-` entries.
- [ ] `npm run check` passes.

## Working in parallel
This task may edit these shared files: `.gitignore` (replace the `.tmp-*` lines with `.tmp/`). Leave every other shared file alone.

- Do not edit `CHANGELOG.md`. If a site owner would notice the change, add `changelog.d/<this issue number>.md` with one line instead.
- Write temporary builds to the OS temp folder or under `.tmp/`, never to a new top-level folder.
- Keep schema properties and UI string keys in alphabetical order, and add yours at its sorted place.
- If the task needs a file not listed above, stop and explain why in the pull request instead of editing it.

## Run
```bash
npm ci
npm run check
```
