## Goal
Render the model. A module page lists its symbols grouped by kind; a symbol page shows the signature in a code block, a parameter table, returns, examples, and deprecation with the status badge. Pages are generated from data with a generator-neutral approach that works on classic Pages (one stub page per module is acceptable).

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `_layouts/api.html`
- `_includes/api/module.html`
- `_includes/api/symbol.html`
- `_includes/api/source-link.html` (empty hook the symbol page includes)
- `_includes/api/llms.html` (empty hook)
- `assets/css/components/api.css`
- `tools/theme/api-layout.test.mjs`

## Done when
- [ ] The fixture renders a module and a symbol page, readable without JavaScript and correct in RTL.
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
