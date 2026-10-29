## Goal
`site/_config.yml` uses `theme: slipway-theme`, so the site shows the gem in `Gemfile.lock`, not `main`. Build the site the way `tools/theme/build.mjs template` builds examples (theme files copied next to the content) in a new `tools/pages/build.mjs`, and have `deploy-site.yml` call it.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/pages/build.mjs`
- `tools/pages/build.test.mjs`

**Edit**
- `.github/workflows/deploy-site.yml`
- `site/_config.yml`

## Done when
- [ ] A change to `assets/css/` on `main` appears on the deployed site after the next deploy.
- [ ] `node tools/pages/build.mjs` builds `_site/` locally.
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
