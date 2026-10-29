## Goal
Least privilege for the `GITHUB_TOKEN`: set `permissions: {}` at the top of every workflow and give each job only the scopes it uses (for example `contents: read`, `pages: write`, `security-events: write`).

## Files
Only these files. Another agent may be working on any other file right now.

**Edit**
- `.github/workflows/*.yml`

## Done when
- [ ] Every workflow has a top-level `permissions: {}`.
- [ ] Every job that needs a scope declares it, and all workflows still pass.
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
