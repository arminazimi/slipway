## Goal
Agents need complete briefs. Read `planning/roadmap/briefs/*.md`, require the `## Goal`, `## Files`, and `## Done when` headings, and check that each path under an **Edit** list exists in the repository or is created by a task listed under its issue's dependencies (paths under **Create** must not exist yet, unless the task is closed).

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `planning/roadmap/briefs.test.mjs`

## Done when
- [ ] The test passes on today's briefs or names each brief to fix (fix them in this pull request only when the change is a path typo).
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
