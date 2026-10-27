## Goal
Create the translated file next to the source (or where the site's language layout says), with the same `translation_key` and the target `lang`. Shares logic with the MCP `scaffold_translation` tool if it exists; otherwise put the logic in `packages/doctor/src/translate.mjs` for both to use. It needs only Node: no Ruby, no Jekyll.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `packages/doctor/src/commands/translate.mjs`
- `packages/doctor/test/command-translate.test.mjs`

## Steps
1. Follow the command template from `cli.commands`: `--help`, `--json`, exit codes, and no prompts when stdin is not a terminal.
2. Test against example sites copied into `.tmp/`.

## Done when
- [ ] `slipway translate --help` documents every flag.
- [ ] The test covers success, `--json`, and one error.
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
