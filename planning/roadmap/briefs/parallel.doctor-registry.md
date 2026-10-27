## Goal
Today checks live in a few large files (`packages/doctor/src/checks.mjs`, `checks/jekyll.mjs`), so every new check conflicts with every other. Each check moves to `packages/doctor/src/checks/<id>.mjs`, exporting its ID, level or warning, and a `run(site)` function; the doctor loads every file in the folder.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `packages/doctor/src/checks/<id>.mjs`, one per existing check
- `packages/doctor/docs/checks/<id>.md`, one per check (ID, why, how to fix)
- `packages/doctor/test/registry.test.mjs` (every check file has an ID, a docs page, and a test)

**Edit**
- `packages/doctor/src/checks.mjs` (becomes the loader)
- `packages/doctor/src/doctor.mjs`
- `packages/doctor/README.md` (how to add a check)

## Steps
1. Move the checks without changing any finding; the existing tests must pass unchanged.
2. Load files in sorted order so report order stays stable.

## Done when
- [ ] The JSON report for every example is identical before and after.
- [ ] Adding a check means adding files only.
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
