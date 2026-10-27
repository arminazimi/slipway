## Goal
Evergreen's hand-written pages have no front matter. GitHub Pages' default plugins (`jekyll-optional-front-matter`, `jekyll-titles-from-headings`) give them a title from their first `# Heading`, and the `doc` and `page` layouts then print that title again as an `h1`. When a page's content starts with an `h1`, the layout must not add its own; `<title>`, breadcrumbs, and the copy-page button keep working.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/theme/fixtures/no-front-matter/` (a page with no front matter, one with a title and no heading, one with both)
- `tools/theme/title-from-heading.test.mjs`

**Edit**
- `_layouts/doc.html`
- `_layouts/page.html`

## Steps
1. In both layouts, detect content that starts with `<h1` (after whitespace) and skip the layout's own `h1`; keep breadcrumbs and the copy-page button before the content.
2. Build the fixture with the Pages gem (`node tools/theme/build.mjs`) and assert exactly one `h1` per page and a `<title>` that matches the heading.

## Done when
- [ ] Every fixture page has exactly one `h1` in both layouts.
- [ ] Pages that have a `title` and no heading render as before.
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
