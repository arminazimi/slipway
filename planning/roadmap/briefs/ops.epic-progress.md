## Goal
Show progress where people look. Keep a line between `<!-- progress -->` markers at the top of each epic body; the roadmap sync must keep it, so write it in an issue comment that is edited in place if the body cannot hold it.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/ops/progress.mjs`
- `tools/ops/progress.test.mjs`
- `.github/workflows/ops-progress.yml`

## Done when
- [ ] The progress line is correct on the fixture and survives a roadmap sync.
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
