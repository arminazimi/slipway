## Goal
Evergreen's site lives in `docs/`. An agent working in the repository root needs `docs/RULES.md:12`, not `RULES.md:12`. The edit prompt prefixes source paths with the site folder: `slipway.source_dir` when set, else `site.github.source.path` from GitHub Pages metadata, else nothing. `sourcemap.json` is unchanged; its paths stay relative to the site source, as the spec says.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/theme/subfolder.test.mjs`

**Edit**
- `_includes/edit-sources.html`
- `assets/js/edit-prompt.js` (only if the prefix cannot be applied in the include)
- `schema/slipway-config.schema.json` (add `source_dir`, at its sorted place)

## Steps
1. Compute the prefix once per page and add it to every `data-source` value.
2. Test with `source_dir: docs`, with the GitHub metadata value, and with neither.

## Done when
- [ ] The edit prompt shows `docs/<file>:<line>` for a site in `docs/`.
- [ ] Sites at the repository root are unchanged.
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
