## Goal
Catch visual regressions an agent cannot see. Reuse `tools/screenshots/` to capture each example in light, dark, LTR, and RTL on `main` and on the pull request, compare them with a small pixel diff (no new heavy dependency; Playwright's own comparison is fine), and upload the changed pairs plus a diff image. Report only; never fail on changes.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/visual-diff/diff.mjs`
- `tools/visual-diff/diff.test.mjs`
- `.github/workflows/visual.yml`

## Done when
- [ ] A pull request that changes a color shows the changed pages in the artifact and in the job summary.
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
