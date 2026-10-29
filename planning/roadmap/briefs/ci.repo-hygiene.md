## Goal
The repository root holds a 10 MB Zola tarball, scratch scripts, and a zero-byte workflow, and local runs leave `.tmp-*` folders. Delete the stray files (check with `git log` that nothing imports them; if `tools/stats/` needs `stats.yml`, write the workflow instead of deleting it), ignore `.tmp-*/`, and add a test with an allow list of root entries.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/repo/root.test.mjs`

**Edit**
- `.gitignore`

## Steps
1. Delete `zola-v0.19.2-x86_64-unknown-linux-gnu.tar.gz`, `test_colors.mjs`, `test_dummy.mjs`, `update-checks.mjs`, and `update-doctor-test.mjs` from the root.
2. Delete or fill `.github/workflows/stats.yml`.

## Done when
- [ ] `git ls-files` at the root lists only allowed entries, and the test fails on a new stray file.
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
