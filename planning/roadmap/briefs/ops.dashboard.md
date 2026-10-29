## Goal
One page that shows the state of the work. A nightly job writes `site/_data/ops.json` (not committed; the deploy workflow generates it) and `site/ops/index.md` renders it with existing blocks (`stats`, tables). The page builds with an empty file.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/ops/snapshot.mjs`
- `tools/ops/snapshot.test.mjs`
- `site/ops/index.md`

## Done when
- [ ] The page builds with no data and with the fixture.
- [ ] The pull request explains the one-line change `deploy-site.yml` needs (a maintainer adds it).
- [ ] `npm run check` passes.

## Working in parallel
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
