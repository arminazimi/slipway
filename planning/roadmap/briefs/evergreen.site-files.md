## Goal
Evergreen writes its own sitemap and llms files with its own tools. When a site ships one of these files itself (with or without front matter), `slipway doctor` must not ask for Slipway's stub, and `<head>` keeps linking to the file.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `packages/doctor/test/fixtures/own-site-files/`
- `packages/doctor/test/own-site-files.test.mjs`
- `docs/site-files.md` (which files Slipway generates, which a site may own, and what each mode needs)

**Edit**
- the stub check under `packages/doctor/src/checks/` (one file after `parallel.doctor-registry`)

## Steps
1. Treat a hand-written `sitemap.xml`, `llms.txt`, `llms-full.txt`, or `robots.txt` as satisfying the stub requirement.
2. Keep the existing finding for a site that has neither the stub nor its own file.

## Done when
- [ ] The fixture with hand-written files gets no stub finding.
- [ ] A site with neither file still gets the existing finding.
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
