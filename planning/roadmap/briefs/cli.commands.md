## Goal
`bin/slipway.mjs` only knows `doctor`. Make it load every file in `packages/doctor/src/commands/` (doctor becomes one), with shared argument parsing, `--help` per command, `--json` output, and documented exit codes, so new commands add files only.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `packages/doctor/src/commands/doctor.mjs`
- `packages/doctor/src/commands/README.md` (the command template)
- `packages/doctor/test/commands.test.mjs`

**Edit**
- `packages/doctor/src/cli.mjs`
- `packages/doctor/bin/slipway.mjs`
- `packages/doctor/README.md`

## Steps
1. Keep `slipway doctor` output and exit codes identical.

## Done when
- [ ] Existing doctor tests pass unchanged.
- [ ] `slipway --help` lists commands from the folder.
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
