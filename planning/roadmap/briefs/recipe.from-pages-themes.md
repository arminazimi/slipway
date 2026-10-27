## Goal
`theme:` becomes a pinned `remote_theme:`; `assets/css/style.scss` that imports `{{ site.theme }}` is removed; `logo`, `show_downloads`, and brand colors map to Slipway keys; pages without front matter keep working. Written from Evergreen's move. Short, tested where it can be: every YAML or config snippet in the page parses, and Slipway keys validate against the config schema.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `site/recipes/from-pages-themes.md` (front matter: `title`, `description`)
- `tools/theme/recipe-from-pages-themes.test.mjs` (parses each code block in the page and validates Slipway config snippets)

## Steps
1. Link to official documentation for everything outside Slipway rather than copying it.
2. Say which mode it needs (classic Pages or Actions), using the words in `docs/modes.md`.

## Done when
- [ ] The recipe is listed on the recipes index.
- [ ] Its test passes.
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
