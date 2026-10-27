## Goal
An agent that translates a page often forgets `lang`. Detect the dominant script of a page's text (Latin, Arabic, Hebrew, Thaana, and so on) and warn when it cannot be written in the page's `lang`.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `packages/doctor/src/checks/lang-mismatch.mjs`
- `packages/doctor/docs/checks/lang-mismatch.md`
- `packages/doctor/test/fixtures/lang-mismatch/`
- `packages/doctor/test/lang-mismatch.test.mjs`

## Steps
1. Ignore code blocks, URLs, and short pages (under 200 letters).

## Done when
- [ ] A Persian page marked `lang: en` gets a warning on its source file.
- [ ] Every example stays clean.
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
