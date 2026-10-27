## Goal
Agents fix findings faster with the rationale and an example in front of them. `--explain <id>` prints `packages/doctor/docs/checks/<id>.md`; `--explain` alone lists every ID with its one-line summary.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `packages/doctor/test/explain.test.mjs`

**Edit**
- `packages/doctor/src/cli.mjs`

## Steps
1. Read the pages at runtime from the package folder so new checks need no CLI change.

## Done when
- [ ] `slipway doctor --explain <id>` works for every check file.
- [ ] Unknown IDs exit with code 2 and list the closest IDs.
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
