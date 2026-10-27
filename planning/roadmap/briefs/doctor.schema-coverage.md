## Goal
Agents create content safely only where a schema describes it. Report layouts and collections used by pages that no schema in `schema/front-matter/` (or the site's own) covers. The check is a warning: it never changes the conformance level, and every finding names the source file and line.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `packages/doctor/src/checks/schema-coverage.mjs`
- `packages/doctor/docs/checks/schema-coverage.md` (ID, why it matters for agents, how to fix, one bad and one good example)
- `packages/doctor/test/fixtures/schema-coverage/` (a site using a custom `recipe` layout with no schema)
- `packages/doctor/test/schema-coverage.test.mjs`

## Steps
1. Follow the check template in `packages/doctor/README.md`.
2. Run the check on every `examples/*` site; fix false positives in the check, not in the examples.

## Done when
- [ ] The check fires on its broken fixture and stays silent on every example.
- [ ] JSON and SARIF output carry the file and line.
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
