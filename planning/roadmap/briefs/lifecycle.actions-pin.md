## Goal
Replace `uses: owner/action@v4` with the commit SHA and a version comment in every workflow and in `action/doctor/action.yml`, and add a test that fails on an unpinned `uses:`. Evergreen stays optional: nothing a site needs depends on it, the same rule ADR 0011 sets for Seaworthy.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/theme/actions-pinned.test.mjs`

**Edit**
- `.github/workflows/*.yml`
- `action/doctor/action.yml`

## Done when
- [ ] Every `uses:` is pinned to a 40-character SHA with a version comment.
- [ ] `npm run check` passes.

## Working in parallel
This task may edit these shared files: `.github/workflows/*.yml` (this task only changes `uses:` lines; start it when no other open pull request edits workflows). Leave every other shared file alone.

- Do not edit `CHANGELOG.md`. If a site owner would notice the change, add `changelog.d/<this issue number>.md` with one line instead.
- Do not edit `package.json`, `package-lock.json`, `.github/workflows/`, `.gitignore`, `ROADMAP.md`, `AGENTS.md`, `_layouts/base.html`, `_includes/head.html`, or `assets/css/slipway.css`. `npm run check` finds new `tools/<name>/run.mjs` and `*.test.mjs` files on its own.
- Write temporary builds to the OS temp folder or under `.tmp/`, never to a new top-level folder.
- Keep schema properties and UI string keys in alphabetical order, and add yours at its sorted place.
- If the task needs a file not listed above, stop and explain why in the pull request instead of editing it.

## Run
```bash
npm ci
npm run check
```
