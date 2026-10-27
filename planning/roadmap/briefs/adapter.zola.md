## Goal
Bring the agent-editable spec to Zola. Zola has no plugins: ship a post-build Node script that reads `content/` and `public/`, and a shortcode-free template partial for `data-source`. Follow the structure of `adapters/hugo/` and `adapters/eleventy/`.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `adapters/zola/` (source, `README.md`, `starter/` with `AGENTS.md` and content schemas)
- `adapters/zola/test/site/` (a small fixture site)
- `adapters/zola/test/zola.test.mjs` (builds the fixture and checks it reaches L2 with `slipway doctor`; skips with a notice when Zola is not installed, like the other adapters)

## Steps
1. Read `spec/agent-editable/0.1.md` and `spec/sourcemap/v0.md` first; do not change them.
2. Do not edit `packages/doctor/src/detect.mjs`; detection for all new adapters lands in `adapter.detect-more`.

## Done when
- [ ] The fixture reaches L2 in `slipway doctor` when the generator is installed.
- [ ] The test skips cleanly when it is not.
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
