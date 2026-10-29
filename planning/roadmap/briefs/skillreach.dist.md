## Goal
One source, many formats. A generator with one module per target in `tools/skill-dist/targets/` (start with the Claude and Codex plugin folders that exist in `plugins/`), and a `--check` mode that `npm run check` runs through `tools/skill-dist/run.mjs`.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/skill-dist/build.mjs`
- `tools/skill-dist/run.mjs`
- `tools/skill-dist/targets/claude.mjs`
- `tools/skill-dist/targets/codex.mjs`
- `tools/skill-dist/build.test.mjs`

**Edit**
- `plugins/`

## Done when
- [ ] Editing a skill without regenerating fails the check; adding a target is one new file.
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
