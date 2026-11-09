## Goal
Playwright tests that a keyboard user can skip to content, use the sidebar, open and use search, open and close the drawer, and switch code tabs.

## Files

**Create**
- `tools/keyboard/run.ts`
- `tools/keyboard/run.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Assert focus order and visible focus at each step.

## Done when
- [ ] The gate fails on a deliberately broken fixture copy and passes on `fixtures/docs-site`.
- [ ] `npm run check` passes.
