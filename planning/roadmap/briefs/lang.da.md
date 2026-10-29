## Goal
Translate every key in `_includes/i18n/en.html` into Danish, in the same order and format. Use the terms the platform's own interfaces use in Danish (for example "table of contents", "skip to content"). Keep placeholders and HTML exactly as in English.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `_includes/i18n/da.html`

## Done when
- [ ] `tools/theme/i18n-coverage.test.mjs` reports Danish complete.
- [ ] A native speaker or a second model reviewed the strings (say which in the pull request).
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
