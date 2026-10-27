## Goal
When Evergreen's data bundle is installed, `slipway doctor` warns about end-of-life Ruby, Node, or Action versions in a site's workflows and version files; without it the check skips with a notice. Evergreen stays optional: nothing a site needs depends on it, the same rule ADR 0011 sets for Seaworthy.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `packages/doctor/src/checks/eol-runtimes.mjs`
- `packages/doctor/docs/checks/eol-runtimes.md`
- `packages/doctor/test/fixtures/eol-runtimes/`
- `packages/doctor/test/eol-runtimes.test.mjs`

## Done when
- [ ] The check warns on Ruby 2.7 in a fixture when the data is present and skips otherwise.
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
