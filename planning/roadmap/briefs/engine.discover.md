## Goal
List every Markdown page, HTML page, and asset under the source folder, in a stable order, with ignore rules.

## Files

**Create**
- `packages/engine/src/content/discover.ts`
- `packages/engine/test/discover.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Ignore `_`-prefixed folders except `_data`, dotfiles, `node_modules`, and paths in `exclude`.
2. A folder whose `index.html` has no front matter is an app page: all its files pass through.
3. Sort paths so output is deterministic.

## Done when
- [ ] On `fixtures/docs-site` the dashboard folder is an app page.
- [ ] `npm run check` passes.
