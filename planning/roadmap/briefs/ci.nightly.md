## Goal
Pull requests run the fast path; nightly runs everything. Run `npm run check` on Node 20, 22, and 24 and on the newest stable Ruby next to `.ruby-version`, and run the `packages/` tests on macOS and Windows. Failures open or update one issue.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `.github/workflows/nightly.yml`

## Done when
- [ ] The nightly workflow runs on a schedule and on `workflow_dispatch`.
- [ ] A failure updates one issue instead of opening many.
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
