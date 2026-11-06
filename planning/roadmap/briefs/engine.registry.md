## Goal
Load units from the theme's folders so adding a component never edits an index.

## Files

**Create**
- `packages/engine/src/render/registry.ts`
- `packages/engine/test/registry.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Read the theme manifest's folders.
2. A component folder exports `default` (component), optional `directive` name, `style.css`, and `client.ts`.
3. Duplicate names are errors.

## Done when
- [ ] A temporary component folder is found without edits elsewhere (tested).
- [ ] `npm run check` passes.
