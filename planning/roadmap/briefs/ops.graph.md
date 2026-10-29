## Goal
Every roadmap issue starts with `<!-- slipway-roadmap-key: ... -->` and lists its dependencies under `## Depends on` as issue links. Build the dependency graph from the issues themselves (not from `ROADMAP.md`, so it works on any branch) and export `ready(issues)`, `blocked(issues)`, and `inProgress(issues)` (an open pull request says `Closes #n`).

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/ops/graph.mjs`
- `tools/ops/github.mjs` (paginated `gh api` reads)
- `tools/ops/fixtures/issues.json`
- `tools/ops/graph.test.mjs`

## Done when
- [ ] Tests cover a ready task, a task blocked by an open dependency, an epic (never ready), and a maintainer task (never dispatched).
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
