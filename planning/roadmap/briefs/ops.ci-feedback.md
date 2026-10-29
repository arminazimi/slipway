## Goal
Agents fix what they can read. On `workflow_run` completed with failure for a pull request labeled or authored by an agent, fetch the failed job's log, cut the last 80 lines of the failing step, and post them in a collapsed comment that also says which command to run locally.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/ops/ci-feedback.mjs`
- `tools/ops/ci-feedback.test.mjs`
- `.github/workflows/ops-ci-feedback.yml`

## Done when
- [ ] Tests extract the failing step from a recorded log.
- [ ] Only one feedback comment per failing run.
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
