## Goal
Search Markdown sources (not the built site) for a string or regular expression and return file, line, column, and the enclosing heading. It reads and writes only inside the site directory the server was given, and its output is JSON with file paths and lines where they apply.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `packages/mcp/src/tools/find_text.mjs`
- `packages/mcp/test/find_text.test.mjs`

## Steps
1. Follow an existing file in `packages/mcp/src/tools/` for the definition, input schema, and errors.
2. Test it against `examples/docs` copied into `.tmp/`; never write into `examples/`.

## Done when
- [ ] The tool appears in `slipway-mcp --list-tools` with an input schema.
- [ ] Its test covers success, a bad input, and a path outside the site.
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
