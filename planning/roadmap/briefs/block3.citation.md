## Goal
Citation block: a reference list and an in-text cite include. Follow `docs/blocks.md`: semantic HTML, logical CSS properties only, readable without JavaScript, UI text through `t.html`.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `_includes/blocks/citation.html`
- `assets/css/components/citation.css`
- `site/blocks/citation.md`
- `tools/theme/block-citation.test.mjs`

## Done when
- [ ] The block renders in LTR and RTL, passes `npm run check:logical`, and its docs page shows it live.
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
