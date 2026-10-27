## Goal
Show shortcuts such as Ctrl+K / ⌘K with `<kbd>`, with a macOS and other-platform variant. It works with JavaScript off, reads correctly in right-to-left, and its options are described by a schema, like every block from `ext.blocks`.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `_includes/blocks/kbd.html` (or the path the Block API uses)
- `assets/css/components/kbd.css`
- the block's schema, where the Block API keeps schemas
- a demo page for this block only, where the Block API keeps demos (LTR and RTL)
- `tools/theme/block-kbd.test.mjs`

**Edit**
- `_includes/i18n/<lang>.html`, only for new UI strings, at their sorted place

## Steps
1. Register the block the way `ext.blocks` documents; if that needs a central list, add your entry at its sorted place.
2. Do not edit the kitchen-sink page (`block.showcase`); it picks blocks up on its own or gets them in its own issue.

## Done when
- [ ] The block renders in LTR and RTL with JavaScript off, and an invalid option fails the schema check.
- [ ] Its CSS uses logical properties and stays inside the CSS budget.
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
