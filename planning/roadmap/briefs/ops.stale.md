## Goal
Abandoned agent pull requests block their issue. Close agent pull requests without a commit for 5 days (configurable in `tools/ops/config.json`) with a comment, and re-add `status: ready` to the linked issue if its dependencies are still closed.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/ops/stale.mjs`
- `tools/ops/stale.test.mjs`
- `.github/workflows/ops-stale.yml`

**Edit**
- `tools/ops/config.json`

## Done when
- [ ] Tests cover a stale, a fresh, and a human pull request (never closed).
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
