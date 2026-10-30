## Goal
A terminal session block that marks prompts, commands, and output; the copy button copies commands only. Works with JavaScript off and in right-to-left.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `_includes/blocks/terminal.html`
- `assets/css/components/terminal.css`
- `tools/theme/kit-terminal.test.mjs`

**Edit**
- `assets/js/copy-code.js` (handle the terminal block)
- `_includes/i18n/<lang>.html`, only for new UI strings, at their sorted place

## Steps
1. Add a fixture under `tools/theme/fixtures/` and build it with the Pages gem in the test.
2. If layouts or schemas are registered in a central list, add your entry at its sorted place.

## Done when
- [ ] The test builds the fixture and checks the rendered HTML.
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
