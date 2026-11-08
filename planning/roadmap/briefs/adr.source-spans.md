## Goal
Decide that every block carries a full source span (start line and column, end line and column), so an agent can replace exactly one block. This is the base of block actions and `edit_block` (ADR 0025, Mizzen differentiators 1 and 3).

## Files

**Create**
- `docs/adr/0026-source-spans.md`

**Edit**
- `docs/adr/README.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Add `endColumn` to `SourcePos`; say how `data-src` encodes a span (for example `path:line:col-endLine:endCol`) and how `sourcemap.json` stores it.
2. Say how a block ID maps to its span and that the mapping is stable across identical builds.
3. List the frozen files the implementation (`engine.source-spans`) may change: `packages/engine/src/contracts/source.ts` and `schema/sourcemap.schema.json`.

## Done when
- [ ] The ADR is Accepted and indexed in `docs/adr/README.md`.
- [ ] `npm run check` passes.
