## Goal
Make adding an Action a one-folder change. A test that finds `action/*/action.yml`, checks required metadata (name, description, branding, inputs documented), and runs each Action's `run.mjs` on its fixture; and `action/README.md` listing them.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `action/README.md`
- `tools/actions/actions.test.mjs`

## Done when
- [ ] The doctor Action passes the shared test, and a new folder is checked without editing the test.
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
