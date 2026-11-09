## Goal
Callouts from `:::note` style directives and GitHub alert syntax, with icons and colors from tokens.

## Files

**Create**
- `packages/theme/components/callout/index.ts`
- `packages/theme/components/callout/style.css`
- `packages/theme/test/component-callout.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Optional custom title.
2. `role=note`; not announced as an alert.

## Done when
- [ ] Renders the fixture examples; light, dark, and right-to-left screenshots in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
