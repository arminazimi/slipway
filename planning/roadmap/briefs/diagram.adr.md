## Goal
Decide how diagrams work in classic Pages (no plugins), Actions mode, and other generators, which tools render them (Mermaid CLI, D2), and how the source reaches twins.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `docs/adr/<next number>-diagrams.md`

## Done when
- [ ] The ADR has a decision per mode and the consequences for page weight and JavaScript.
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
