## Goal
Today `.github/workflows/ci.yml` holds every job, so any CI change conflicts with every other. Keep the check matrix, the upgrade test, and the browser tests in `ci.yml`, add a final `ci-ok` job that `needs` all of them and fails if any failed or was cancelled, and write down the rule: a new concern (lint, security, reports) gets its own workflow file.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `.github/workflows/README.md` (one line per workflow: what it runs, when, and whether it is required)

**Edit**
- `.github/workflows/ci.yml`

## Done when
- [ ] `ci-ok` runs on every push and pull request and fails when any job it needs fails.
- [ ] `.github/workflows/README.md` lists every workflow and says how to add one.
- [ ] `npm run check` passes.

## Working in parallel
- Do not edit `CHANGELOG.md`. If a site owner would notice the change, add `changelog.d/<this issue number>.md` with one line instead.
- Do not edit `package.json`, `package-lock.json`, `.github/workflows/`, `.gitignore`, `ROADMAP.md`, `AGENTS.md`, `_layouts/base.html`, `_includes/head.html`, or `assets/css/slipway.css`, except the files listed under Files above. `npm run check` finds new `tools/<name>/run.mjs` and `*.test.mjs` files on its own.
- Write temporary builds to the OS temp folder or under `.tmp/`, never to a new top-level folder.
- Keep schema properties and UI string keys in alphabetical order, and add yours at its sorted place.
- If the task needs a file not listed above, stop and explain why in the pull request instead of editing it.

## Run
```bash
npm ci
npm run check
```
