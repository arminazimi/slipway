## Goal
Check that skills work, not only that their paths exist. Each skill gets `skills/<name>/evals.json` (prompt, starting example, checks on the result such as "doctor level ≥ L2" or "file X contains Y"). A runner applies an agent CLI when one is configured and skips otherwise; a weekly workflow runs it with a secret.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/skill-evals/run-evals.mjs`
- `tools/skill-evals/checks.mjs`
- `tools/skill-evals/checks.test.mjs`
- `skills/slipway-content/evals.json`
- `.github/workflows/skill-evals.yml`

## Done when
- [ ] The checks are unit-tested; the runner skips cleanly without an agent CLI.
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
