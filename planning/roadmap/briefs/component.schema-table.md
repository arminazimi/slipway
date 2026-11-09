## Goal
Render a JSON Schema from `_data` or a file path as a table: name, type, required, default, description, nested properties.

## Files

**Create**
- `packages/theme/components/schema-table/index.ts`
- `packages/theme/components/schema-table/style.css`
- `packages/theme/test/component-schema-table.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Use it in `fixtures/docs-site` for the config reference page.

## Done when
- [ ] Renders the fixture examples; light, dark, and right-to-left screenshots in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
