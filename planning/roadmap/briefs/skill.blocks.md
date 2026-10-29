## Goal
A skill that teaches an agent to choose and insert content blocks with valid parameters. Follow the shape of `skills/slipway-content/SKILL.md`: when to use it, a baseline check, numbered steps, and how to verify with `slipway doctor`. Link reference files instead of repeating them.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `skills/slipway-blocks/SKILL.md`
- `skills/slipway-blocks/reference/` (only if needed)

## Done when
- [ ] The skill passes `tools/skills/all.test.mjs`.
- [ ] Following it on an example site gives the expected result (describe the run in the pull request).
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
