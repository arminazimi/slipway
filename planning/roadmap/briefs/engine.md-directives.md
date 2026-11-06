## Goal
Let authors write `:::callout{type=warning}` or GitHub's `> [!NOTE]` and have the engine hand the theme a component node with its attributes.

## Files

**Create**
- `packages/engine/src/markdown/plugins/directives.ts`
- `packages/engine/test/md-directives.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. remark-directive for `:::name{attrs}` containers and `::name` leaves.
2. Convert GitHub alert blockquotes to the `callout` directive.
3. Output a hast element `<sl-component name=… data-props=…>` the render step resolves; unknown names are a warning with position.

## Done when
- [ ] Nested directives work (tested).
- [ ] `npm run check` passes.
