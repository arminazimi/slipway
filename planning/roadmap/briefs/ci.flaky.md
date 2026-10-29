## Goal
Find flaky tests before they block agents. Run every `*.test.mjs` three times with the TAP or JSON reporter, compare results, and create or update one issue labeled `flaky` listing each flaky test with its failure message.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/flaky/flaky.mjs`
- `tools/flaky/flaky.test.mjs`
- `.github/workflows/flaky.yml`

## Done when
- [ ] The comparison logic is tested on recorded reporter output.
- [ ] The issue is updated, not duplicated.
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
