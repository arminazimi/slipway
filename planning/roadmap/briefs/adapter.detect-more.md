## Goal
Add detection for VitePress, Starlight, Zola, mdBook, Hexo, Quarto, Sphinx, Pelican, and Nextra: their config file, source folder, and default output folder.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `packages/doctor/test/fixtures/detect-<generator>/` (config files only)
- `packages/doctor/test/detect-more.test.mjs`

**Edit**
- `packages/doctor/src/detect.mjs`

## Steps
1. Keep detection order stable and document it in the file.

## Done when
- [ ] Each generator's minimal config is detected with the right folders.
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
