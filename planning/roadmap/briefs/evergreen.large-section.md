## Goal
Evergreen has 516 generated pages under `/rules/` that are not listed in `_data/navigation.yml`. A navigation item gets an optional `match` URL prefix; on every page under it, the sidebar marks that item with `aria-current="true"`, the breadcrumbs show the section, and previous/next links stay hidden.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/theme/large-section.test.mjs` (generates 600 pages into `.tmp/` at test time; nothing generated is committed)

**Edit**
- `_layouts/doc.html`
- `_includes/breadcrumbs.html`
- `schema/navigation.schema.json`

## Steps
1. Add `match` to the navigation schema, at its sorted place, with a description.
2. Mark the matching item in the sidebar and use it as the parent in breadcrumbs.
3. Build 600 generated pages with the Pages gem and assert the markup and the build-time budget in `tools/theme/build-time.test.mjs` still hold.

## Done when
- [ ] Every generated page marks its section in the sidebar and breadcrumbs.
- [ ] The 600-page build stays within the existing build-time budget.
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
