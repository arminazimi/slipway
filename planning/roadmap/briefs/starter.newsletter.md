## Goal
An archive of newsletter issues with a subscribe form (form service of the owner's choice), tags, and a feed. Like every starter, it is a complete site a person copies with "Use this template", has its own `AGENTS.md`, and reaches the top level in `slipway doctor`.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `starters/newsletter/` (config, pages, sample content, `AGENTS.md`, `README.md`, stubs)
- `tools/starters/newsletter.test.mjs` (pattern: `tools/starters/blog.test.mjs`)

## Steps
1. Use only existing layouts and blocks; if a needed block does not exist yet, leave plain Markdown and note it in the README.
2. Run `npm run twins` and `npm run sourcemap` on it if it uses classic mode.

## Done when
- [ ] The starter builds with the Pages gem and passes the axe, HTML, and no-JavaScript checks.
- [ ] `slipway doctor` reports the top level.
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
