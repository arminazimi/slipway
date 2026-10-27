## Goal
Sites copy one optional workflow that runs Evergreen on their `Gemfile`, `package.json`, and workflows, report-only. Evergreen stays optional: nothing a site needs depends on it, the same rule ADR 0011 sets for Seaworthy.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `starter-files/optional/.github/workflows/lifecycle.yml`
- `starter-files/optional/README.md` (how to opt in)
- `tools/theme/starter-lifecycle.test.mjs` (YAML parses, Action pinned)

## Done when
- [ ] A site that copies the file gets a report-only lifecycle job; the starter files without it are unchanged.
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
