## Goal
Two pull requests that each append a key at the end of the same object conflict; two that insert at their sorted places usually merge cleanly. A test keeps `properties` in every file under `schema/` and the keys in every `_includes/i18n/<lang>.html` in alphabetical order; generated references follow that order.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/theme/sorted.test.mjs`

**Edit**
- `schema/**/*.json` (reorder properties only)
- `_includes/i18n/*.html` (reorder only)
- `tools/theme/config-doc.mjs` and tools/skills/*-reference.mjs if their output order depends on input order; regenerate their output

## Steps
1. Reorder without changing content; the built examples stay identical.

## Done when
- [ ] The test fails on an out-of-order key and names it.
- [ ] Every generated reference is up to date.
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
