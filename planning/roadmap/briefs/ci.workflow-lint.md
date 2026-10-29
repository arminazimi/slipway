## Goal
Catch broken and unsafe workflows before they merge. Run actionlint and zizmor (pinned versions) when a pull request touches `.github/` or `action/`; zizmor findings go to code scanning as SARIF.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `.github/workflows/workflow-lint.yml`

## Done when
- [ ] The workflow fails on a deliberately broken workflow in a test branch (describe the test in the pull request).
- [ ] Existing workflows pass, or each remaining finding has an issue.
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
