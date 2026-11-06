## Goal
Create the theme workspace with the folders the registries will discover, so layout, chrome, component, and token tasks only add their own folders.

## Files

**Create**
- `packages/theme/package.json`
- `packages/theme/tsconfig.json`
- `packages/theme/README.md`
- `packages/theme/src/index.ts`
- `packages/theme/layouts/README.md`
- `packages/theme/chrome/README.md`
- `packages/theme/components/README.md`
- `packages/theme/tokens/README.md`
- `packages/theme/styles/README.md`
- `packages/theme/test/smoke.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Package name `@slipway/theme`, peer dependency on `preact`, JSX set to `react-jsx` with `jsxImportSource: preact`.
2. Each registry README states the folder convention from ADR 0023 (file names, what each file exports).
3. `src/index.ts` exports the theme manifest: name, the folders to discover, and nothing else.
4. Extend the tsconfig from the engine's base settings.

## Done when
- [ ] `npm run check` runs the theme smoke test.
- [ ] Each registry folder's README shows a one-file example.
