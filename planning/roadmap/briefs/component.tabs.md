## Goal
General tabs for any content (for example per operating system), synced by label like code tabs.

## Files

**Create**
- `packages/theme/components/tabs/index.tsx`
- `packages/theme/components/tabs/style.css`
- `packages/theme/components/tabs/client.ts`
- `packages/theme/test/component-tabs.test.tsx`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Reuse the sync module from code tabs; do not copy it.

## Done when
- [ ] Renders the fixture examples; light, dark, and right-to-left screenshots in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
