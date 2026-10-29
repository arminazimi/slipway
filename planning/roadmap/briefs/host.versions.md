## Goal
Readers need the docs for the version they use. Build each tag listed in `slipway.yml` `versions` into `/v/<version>/`, write `/v/versions.json`, and add a switcher include that works without JavaScript (a list of links) and enhances to a select.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/host/steps/versions.mjs`
- `tools/host/versions.test.mjs`
- `_includes/version-switcher.html`

## Done when
- [ ] The fixture builds two versions and the switcher links each page to the same page in the other version, or to its home when missing.
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
