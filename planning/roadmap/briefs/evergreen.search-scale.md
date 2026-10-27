## Goal
Evergreen's 600 pages would make `search.json` several megabytes. Index entries keep the title, URL, headings, and a short excerpt; pages with `search: false` are left out; and `assets/js/search.js` fetches the index only when the search field is first focused or typed in.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/theme/search-scale.test.mjs`

**Edit**
- `assets/js/search.js`
- the template that writes `search.json`
- `schema/front-matter/base.schema.json` (add `search`, at its sorted place)

## Steps
1. Trim each index entry to title, URL, `h2`/`h3` text, and the first 300 characters of text.
2. Skip pages with `search: false`, pages with `layout: none`, and non-HTML files.
3. Load the index lazily; keep the no-JavaScript fallback working.

## Done when
- [ ] A 600-page fixture produces an index under 600 KB.
- [ ] `npm run check:js` still passes, and search works with the index loaded lazily.
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
