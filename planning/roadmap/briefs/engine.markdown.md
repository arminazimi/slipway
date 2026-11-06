## Goal
Parse Markdown into mdast with positions, and run every plugin found in `src/markdown/plugins/` in a stable order.

## Files

**Create**
- `packages/engine/src/markdown/parse.ts`
- `packages/engine/src/markdown/plugins/README.md`
- `packages/engine/src/markdown/plugins/gfm.ts`
- `packages/engine/test/markdown.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. unified + remark-parse; GFM (tables, task lists, strikethrough, autolinks) as the first plugin.
2. Plugins are files exporting `{ name, order, plugin }`; the loader sorts by `order` then name.
3. Offset positions by `bodyLine`.

## Done when
- [ ] Adding a plugin file needs no other edit.
- [ ] `npm run check` passes.
