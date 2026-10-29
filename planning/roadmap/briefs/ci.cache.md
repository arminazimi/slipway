## Goal
Make CI faster without changing what it checks. `ruby/setup-ruby` already caches gems when `bundler-cache` is on; add `actions/cache` for `.seaworthy/` keyed on `tools/seaworthy/pin.json`, and for the Playwright browser folder keyed on the Playwright version. Write each job's duration to `$GITHUB_STEP_SUMMARY`.

## Files
Only these files. Another agent may be working on any other file right now.

**Edit**
- `.github/workflows/ci.yml`

## Done when
- [ ] A second run on the same commit restores all three caches.
- [ ] The job summary shows the check time.
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
