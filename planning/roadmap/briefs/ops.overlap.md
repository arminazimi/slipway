## Goal
Two agents editing one file is the main cause of conflicts. On each pull request push, compare its changed files with every other open pull request and comment (one sticky comment) with the overlaps, ignoring `changelog.d/`.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/ops/overlap.mjs`
- `tools/ops/overlap.test.mjs`
- `.github/workflows/ops-overlap.yml`

## Done when
- [ ] The comment lists each overlapping file and pull request, and disappears when the overlap is gone.
- [ ] `npm run check` passes.

## Working in parallel
- Do not edit `CHANGELOG.md`. If a site owner would notice the change, add `changelog.d/<this issue number>.md` with one line instead.
- Do not edit `package.json`, `package-lock.json`, `.github/workflows/`, `.gitignore`, `ROADMAP.md`, `AGENTS.md`, `_layouts/base.html`, `_includes/head.html`, or `assets/css/slipway.css`, except the files listed under Files above. `npm run check` finds new `tools/<name>/run.mjs` and `*.test.mjs` files on its own.
- Write temporary builds to the OS temp folder or under `.tmp/`, never to a new top-level folder.
- Keep schema properties and UI string keys in alphabetical order, and add yours at its sorted place.
- If the task needs a file not listed above, stop and explain why in the pull request instead of editing it.

## Run
```bash
npm ci
npm run check
```
