## Goal
Groups open and close with `<details>`; the group with the current page is open; state is remembered per site.

## Files

**Create**
- `packages/theme/chrome/sidebar/client.ts`
- `packages/theme/test/chrome-sidebar-collapse.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Works without JavaScript (details); the script only remembers state in localStorage inside try/catch.

## Done when
- [ ] `npm run check` passes.
