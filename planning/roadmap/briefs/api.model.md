## Goal
Decide one data model every converter writes and the theme reads. Cover modules, classes, functions, methods, types, constants, endpoints; signatures as text plus parameters with types and docs; return values; examples; deprecation; source file, line, and commit. Look at TypeDoc JSON, rustdoc JSON, griffe, and Go's `go/doc` before deciding.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `docs/adr/<next number>-api-model.md`
- `schema/api.schema.json`
- `tools/api/fixtures/model.json`
- `tools/api/model.test.mjs`

## Done when
- [ ] The fixture validates against the schema, and the ADR records what was left out and why.
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
