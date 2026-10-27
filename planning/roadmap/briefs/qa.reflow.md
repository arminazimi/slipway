## Goal
WCAG 1.4.10: at 320 CSS pixels wide, no page scrolls horizontally except code blocks and wide tables in their own scroll containers. It runs on every `examples/*` site, light and dark, LTR and RTL, and skips with a notice when its tool (Playwright or Ruby) is missing.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/reflow/run.mjs`
- `tools/reflow/README.md`
- `tools/reflow/reflow.test.mjs` (unit tests for the checker itself)

## Steps
1. Follow the structure of `tools/a11y/` or `tools/nojs/`.
2. When it finds a real problem in the theme, fix it only if the fix is in a component file; otherwise list it in the pull request and open a follow-up issue.

## Done when
- [ ] `npm run check` runs it automatically.
- [ ] It fails on a deliberately broken fixture and passes on the examples.
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
