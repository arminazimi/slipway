## Goal
Fix the rules that let 20 pull requests merge in any order: one folder per unit, registries that discover files, and an engine that knows nothing about Slipway.

## Files

**Create**
- `docs/adr/0023-engine-theme-boundary.md`

**Edit**
- `AGENTS.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Engine owns: config, content model, Markdown, navigation, render host, outputs, diagnostics, CLI. Theme owns: layouts, chrome, components, tokens, styles, client islands.
2. Folder conventions: `packages/engine/src/outputs/<name>.ts`, `packages/engine/src/markdown/plugins/<name>.ts`, `packages/theme/layouts/<name>.tsx`, `packages/theme/chrome/<name>/`, `packages/theme/components/<name>/`, `packages/theme/tokens/<group>.json`.
3. Registries find these by folder; adding a unit never edits a shared index file.
4. The engine imports nothing from `packages/theme` and contains no Slipway name, color, or layout; `quality.boundary` enforces it.
5. Contracts in `packages/engine/src/contracts/` change only through an ADR.
6. In AGENTS.md, replace the parallel-work section with these rules in short form and link the ADR.

## Done when
- [ ] The ADR is merged with status Accepted.
- [ ] AGENTS.md states the folder-per-unit and boundary rules and links the ADR.
- [ ] `npm run check` passes.
