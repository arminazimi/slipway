## Goal
Reviewers and agents should see what a pull request changed without reading logs. Build `main` and the pull request, collect the numbers the existing tools already compute (`tools/theme/css-budget.mjs`, `tools/page-weight/`, `slipway doctor --format json` on each example), and update one comment (find it by a hidden marker) with a table of before, after, and change.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/report/collect.mjs`
- `tools/report/render.mjs`
- `tools/report/render.test.mjs`
- `.github/workflows/report.yml`

## Done when
- [ ] The comment is updated, not duplicated, on each push.
- [ ] `render.test.mjs` covers increases, decreases, and a new example.
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
