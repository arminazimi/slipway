## Goal
Each new guide or recipe edits `site/_data/navigation.yml` or an index page by hand. `site/recipes/index.md` and a new `site/guides/index.md` list the pages in their folder, sorted by `nav_order` then title, so adding one is one new file.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `site/guides/index.md`
- `tools/theme/docs-autonav.test.mjs`

**Edit**
- `site/recipes/index.md`
- `site/_data/navigation.yml` (point "Migration" at the guides index)
- front matter of existing pages in `site/guides/` and `site/recipes/` (`description`, optional `nav_order`)

## Steps
1. Build the docs site and check every recipe and guide is listed once.

## Done when
- [ ] A new file in `site/recipes/` shows up on the index with no other edit.
- [ ] `npm run check` passes.

## Working in parallel
This is a Wave 0 task: it may edit the shared files listed under **Files**, and nothing else shared.

- Do not edit `CHANGELOG.md`. If a site owner would notice the change, add `changelog.d/<this issue number>.md` with one line instead.
- Write temporary builds to the OS temp folder or under `.tmp/`, never to a new top-level folder.
- Keep schema properties and UI string keys in alphabetical order, and add yours at its sorted place.
- If the task needs a file not listed above, stop and explain why in the pull request instead of editing it.

## Run
```bash
npm ci
npm run check
```
