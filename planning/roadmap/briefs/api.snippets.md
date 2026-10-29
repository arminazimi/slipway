## Goal
Docs code drifts from real code. `{% include snippet.html file="src/x.ts" region="setup" %}` prints the lines between `// region setup` and `// endregion` (any comment style) as a code block with a source link. In classic Pages the file must be inside the site, so add `tools/snippets/sync.mjs` that copies regions into `_includes/snippets/` and a check that fails when a copy is stale.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `_includes/snippet.html`
- `tools/snippets/sync.mjs`
- `tools/snippets/snippets.test.mjs`

## Done when
- [ ] A missing region fails the check with the file and region name.
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
