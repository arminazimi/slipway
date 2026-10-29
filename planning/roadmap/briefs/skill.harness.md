## Goal
Today each skill has its own test in `tools/skills/`. Move the shared checks (front matter `name` and `description`, every path exists, every command is a real script, every YAML snippet validates) into one test that runs over every skill folder, and keep the skill-specific tests for what is unique.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/skills/all.test.mjs`

**Edit**
- `tools/skills/skills.test.mjs`
- `tools/skills/content.test.mjs`
- `tools/skills/doctor.test.mjs`

## Done when
- [ ] A new skill folder is checked with no test edit.
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
