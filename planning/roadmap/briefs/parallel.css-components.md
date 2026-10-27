## Goal
Every component's CSS goes into `assets/css/slipway.css`, so components conflict. New components put their CSS in `assets/css/components/<name>.css`; their include links it once per page through `_includes/component-css.html`. The CSS budget and logical-property checks cover the new folder.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `_includes/component-css.html` (emits `<link rel="stylesheet">` once per page per name)
- `assets/css/components/README.md`
- `tools/theme/component-css.test.mjs`

**Edit**
- `tools/theme/css-budget.mjs` and tools/theme/logical-css.mjs (scan `assets/css/` recursively)
- `docs/overrides.md` (one paragraph)

## Steps
1. Prove the link appears once even when a component is used three times on a page.
2. Check the HTML still validates (`tools/html-validate`).

## Done when
- [ ] A sample component used three times links its CSS once.
- [ ] Budgets and the logical-CSS check include `assets/css/components/`.
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
