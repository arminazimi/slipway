## Goal
A site with only a `docs/` folder still gets a sidebar: folders become groups, `order` and titles sort them.

## Files

**Create**
- `packages/engine/src/nav/from-folders.ts`
- `packages/engine/test/nav-folders.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Folder `index.md` title names the group.
2. Sort by `order`, then title.

## Done when
- [ ] `npm run check` passes.
