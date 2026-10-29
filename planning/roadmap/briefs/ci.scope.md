## Goal
Briefs list the files a task may touch; agents sometimes wander. Read the linked issue (`Closes #n`), parse the paths under its `## Files` section (globs allowed), and fail when the pull request changes a file outside them. `changelog.d/<n>.md` is always allowed. A `scope: wide` label skips the check for maintainers.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/scope/scope.mjs`
- `tools/scope/scope.test.mjs`
- `.github/workflows/scope.yml`

## Done when
- [ ] Tests cover exact paths, folders, globs, the changelog fragment, and an issue with no `## Files` section (pass with a notice).
- [ ] The workflow names each file outside the brief.
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
