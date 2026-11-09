## Goal
Build `packages/theme/tokens/*.json` (one file per group) into `packages/theme/styles/tokens.css`, with a check that the CSS is current, and freeze the list of semantic token names so layouts and components can be built before the values are final.

## Files

**Create**
- `packages/theme/scripts/tokens.ts`
- `packages/theme/tokens/names.json`
- `packages/theme/test/tokens.test.ts`

**Edit**
- `packages/theme/package.json`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. W3C design tokens format; groups are discovered by file name.
2. Light and dark through `light-dark()` and `[data-theme]` overrides.
3. `--check` fails when `tokens.css` is stale; wire it into the theme's test script.
4. `names.json` lists every semantic token (colors, type, space, radius, shadow, motion, states, code) with a neutral placeholder value; group files override the values, and a name missing from `names.json` is an error.

## Done when
- [ ] Adding a token group file needs no other edit.
- [ ] `npm run check` passes.
