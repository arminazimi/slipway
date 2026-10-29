## Goal
Take a repository folder, write a temporary Jekyll source (theme files, generated `_config.yml`, the docs pages with front matter added from their first heading), build it, and write the output. Pages keep their URLs relative to `docs/`. Run the build as a list of steps loaded from `tools/host/steps/*.mjs` in name order, so later features add a step file instead of editing `build.mjs`.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/host/build.mjs`
- `tools/host/steps/`
- `tools/host/build.test.mjs`
- `tools/host/fixtures/plain-docs/`

## Done when
- [ ] The fixture (Markdown only, no front matter) builds into a themed site with navigation.
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
