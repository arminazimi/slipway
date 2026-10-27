## Goal
`skills/slipway-site/SKILL.md` tells agents to check a gem, npm package, or Action with Evergreen's `check_dependency` MCP tool or CLI before adding it, when Evergreen is available, and to go on without it otherwise. Evergreen stays optional: nothing a site needs depends on it, the same rule ADR 0011 sets for Seaworthy.

## Files
Only these files. Another agent may be working on any other file right now.

**Edit**
- `skills/slipway-site/SKILL.md` (one short section)

## Done when
- [ ] `tools/skills/skills.test.mjs` passes with the new section.
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
