## Goal
https://arminazimi.github.io/slipway/ links `/assets/css/slipway.css`, which is a 404, because `deploy-site.yml` builds with `--baseurl ""`. Use the base URL Pages reports (`actions/configure-pages` output `base_path`), for both the site and `/spec/`, and add a test that builds the site with `baseurl: /slipway` and checks every local `href` and `src` starts with it.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/pages/baseurl.test.mjs`

**Edit**
- `.github/workflows/deploy-site.yml`

## Done when
- [ ] After deploy, the live home page loads its stylesheets (check with `curl`).
- [ ] The test fails if the base URL is dropped again.
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
