## Goal
Pin each `uses:` that is not a local path to a 40-character commit SHA, with the version tag in a trailing comment (`# v4.2.0`). Make sure `.github/dependabot.yml` has the `github-actions` ecosystem so the pins get updated.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/workflows/pins.test.mjs`

**Edit**
- `.github/workflows/*.yml`
- `action/*/action.yml`
- `.github/dependabot.yml`

## Done when
- [ ] No `uses:` in the repository points at a tag or branch.
- [ ] A test in `tools/workflows/pins.test.mjs` fails on an unpinned action.
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
