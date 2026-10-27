## Goal
Evergreen's `docs/dashboard/` is a hand-written HTML page with its own stylesheet, script, and `data.json`. Slipway must copy it unchanged and keep it out of generated indexes, and a navigation item can link to it under `baseurl`.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/theme/fixtures/app-page/` (`dashboard/index.html`, `style.css`, `dashboard.js`, `data.json`, and a page that links to it)
- `tools/theme/app-pages.test.mjs`

**Edit**
- `_includes/llms-item.html`, only if the test shows the app page listed there

## Steps
1. Build the fixture and compare the app's files byte for byte with the source.
2. Assert the app page is absent from `search.json`, `llms.txt`, and `sourcemap.json`, and that its nav link respects `baseurl`.

## Done when
- [ ] The app's files are copied unchanged.
- [ ] No generated index lists the app page.
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
