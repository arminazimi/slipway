## Goal
Catch references to renamed or deleted symbols. Add one check file in `packages/doctor/src/checks/` that reads `_data/api/*.json` and reports links to `api/<symbol>` pages that do not exist, at the Markdown file and line.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `packages/doctor/src/checks/jekyll.api-links.mjs`
- `packages/doctor/test/fixtures/jekyll-api-links/`

## Done when
- [ ] The check fires on the broken fixture and stays silent on clean fixtures.
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
