## Goal
Agents need one place that says which files are shared. `.github/hot-files.txt` lists them; `tools/hot-files/run.mjs` compares the branch with `origin/main` and prints a warning per hot file touched (never fails); `CONTRIBUTING.md` gets a "Working in parallel" section.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `.github/hot-files.txt`
- `tools/hot-files/run.mjs`
- `tools/hot-files/hot-files.test.mjs`

**Edit**
- `CONTRIBUTING.md` ("Working in parallel": hot files, changelog fragments, `.tmp/`, sorted keys, one file per check, tool, and language)

## Steps
1. Skip quietly when `origin/main` is not available (shallow clones).

## Done when
- [ ] Editing `CHANGELOG.md` on a branch prints a warning naming it.
- [ ] CONTRIBUTING.md explains the rules in under 30 lines.
- [ ] `npm run check` passes.

## Working in parallel
This is a Wave 0 task: it may edit the shared files listed under **Files**, and nothing else shared.

- Do not edit `CHANGELOG.md`. If a site owner would notice the change, add `changelog.d/<this issue number>.md` with one line instead.
- Write temporary builds to the OS temp folder or under `.tmp/`, never to a new top-level folder.
- Keep schema properties and UI string keys in alphabetical order, and add yours at its sorted place.
- If the task needs a file not listed above, stop and explain why in the pull request instead of editing it.

## Run
```bash
npm ci
npm run check
```
