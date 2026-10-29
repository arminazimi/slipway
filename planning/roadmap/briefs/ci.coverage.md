## Goal
Measure line coverage of `packages/`, `tools/`, and `planning/` with `node --test --experimental-test-coverage` (no new dependency). Store the floor in `tools/coverage/floor.json`; fail when coverage drops below it, and print a notice suggesting a higher floor when it rises.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/coverage/coverage.mjs`
- `tools/coverage/floor.json`
- `tools/coverage/coverage.test.mjs`
- `.github/workflows/coverage.yml`

## Done when
- [ ] The workflow writes the coverage table to the job summary and fails below the floor.
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
