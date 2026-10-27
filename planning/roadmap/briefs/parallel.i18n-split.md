## Goal
All built-in UI strings sit in `_includes/i18n-builtin.html`, so every new language or string conflicts. Split it into `_includes/i18n/<lang>.html`, chosen with a variable include; a language may also ship `assets/css/lang/<lang>.css`, linked only on pages in that language. List every right-to-left code (ar, arc, ckb, dv, fa, he, ks, ku, ps, sd, syr, ug, ur, yi) in `_includes/dir.html` now, so new languages do not edit it.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `_includes/i18n/<lang>.html` for each built-in language
- `_includes/lang-css.html`
- `tools/theme/i18n-split.test.mjs`

**Edit**
- `_includes/i18n-builtin.html` (becomes the dispatcher)
- `_includes/t.html`
- `_includes/dir.html`
- `_layouts/base.html` or _includes/head.html (one line for `lang-css.html`; this task may edit it)

## Steps
1. Move strings without changing any of them; built HTML of every example stays identical.
2. Document in `_includes/i18n/README.md` how to add a language: one strings file, optional CSS, one test.

## Done when
- [ ] Every example builds to identical HTML.
- [ ] Adding a language touches only new files.
- [ ] `npm run check` passes.

## Working in parallel
This is a Wave 0 task: it may edit the shared files listed under **Files**, and nothing else shared.

- Do not edit `CHANGELOG.md`. If a site owner would notice the change, add `changelog.d/<this issue number>.md` with one line instead.
- Write temporary builds to the OS temp folder or under `.tmp/`, never to a new top-level folder.
- Keep schema properties and UI string keys in alphabetical order, and add yours at its sorted place.
- If the task needs a file not listed above, stop and explain why in the pull request instead of editing it.

## Run
```bash
npm ci
npm run check
```
