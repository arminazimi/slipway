## Goal
Choosing a tab label (for example `npm` or `Go`) switches every group with that label on the page and on later pages.

## Files

**Create**
- `packages/theme/components/code-tabs/sync.ts`
- `packages/theme/test/component-code-tabs-sync.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Remember in localStorage inside try/catch; `?lang=` in the URL wins.
2. Keep the scroll position when other groups switch.

## Done when
- [ ] `npm run check` passes.
