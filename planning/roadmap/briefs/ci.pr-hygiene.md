## Goal
Enforce the two rules every agent pull request must follow. The logic lives in `tools/pr-hygiene/check.mjs` (pure function: pull request body and changed files in, list of problems out) with tests; the workflow calls it. Files a site owner sees: `_layouts/`, `_includes/`, `assets/`, `schema/`, `skills/`. A `no-changelog` label skips the fragment rule.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/pr-hygiene/check.mjs`
- `tools/pr-hygiene/check.test.mjs`
- `.github/workflows/pr-hygiene.yml`

## Done when
- [ ] Tests cover a body without `Closes #`, a theme change without `changelog.d/<n>.md`, and the `no-changelog` label.
- [ ] The workflow comments the problems on the pull request.
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
