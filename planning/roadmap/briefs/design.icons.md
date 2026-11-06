## Goal
About 20 SVG icons (search, menu, close, chevron, copy, check, external, edit, sun, moon, github, info, warning, danger, tip, link, file, folder, terminal, arrow) in one style.

## Files

**Create**
- `packages/theme/icons/`
- `packages/theme/icons/index.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Use an open-licensed set (Lucide) and record its license.
2. `index.ts` exports each as a string; icons use `currentColor`.
3. Directional icons are marked so they mirror in right-to-left.

## Done when
- [ ] `npm run check` passes.
