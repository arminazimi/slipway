## Goal
A component's `client.ts` loads as a module only on pages that use it.

## Files

**Create**
- `packages/engine/src/render/islands.ts`
- `packages/engine/test/islands.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Strip TypeScript types for the browser; minify.
2. One `<script type=module>` per page that imports the needed islands.

## Done when
- [ ] A page with no interactive component has no script tag (tested).
- [ ] `npm run check` passes.
