## Goal
HTTP APIs need a reference too. Convert OpenAPI 3.1 (YAML or JSON) into model endpoints grouped by tag, and render them with the existing endpoint block.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/api/openapi/convert.mjs`
- `tools/api/openapi/fixtures/`
- `tools/api/openapi/convert.test.mjs`

## Done when
- [ ] The Petstore example converts and renders one page per tag.
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
