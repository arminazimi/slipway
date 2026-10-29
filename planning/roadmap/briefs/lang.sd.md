## Goal
Translate every key in `_includes/i18n/en.html` into Sindhi, in the same order and format. Use the terms the platform's own interfaces use in Sindhi (for example "table of contents", "skip to content"). Keep placeholders and HTML exactly as in English. `sd` is already in the right-to-left list in `_includes/dir.html`; check the page renders right to left and add `assets/css/lang/sd.css` only if the script needs a font stack.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `_includes/i18n/sd.html`
- `assets/css/lang/sd.css` (only if needed)

## Done when
- [ ] `tools/theme/i18n-coverage.test.mjs` reports Sindhi complete.
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
