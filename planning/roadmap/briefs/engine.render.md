## Goal
Render a page through a layout component to an HTML string, resolving `sl-component` nodes to theme components.

## Files

**Create**
- `packages/engine/src/render/render.ts`
- `packages/engine/test/render.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. `preact-render-to-string`; doctype and `<html lang dir>` from the page.
2. Replace each `sl-component` element with the registered component's output; keep `data-src`.
3. Collect the islands and CSS each page used.

## Done when
- [ ] A test layout and component render with positions kept.
- [ ] `npm run check` passes.
