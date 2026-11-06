## Goal
When the site lives in `docs/`, edit links, edit prompts, and the source map name `docs/…` paths.

## Files

**Create**
- `packages/engine/test/subfolder.test.ts`
- `fixtures/subfolder-repo/`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. A small fixture repository with the site in `docs/`.
2. Find the repository root by walking up to `.git` or from config `repository.root`.

## Done when
- [ ] `npm run check` passes.
