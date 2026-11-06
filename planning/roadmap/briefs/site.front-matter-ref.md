## Goal
Generate `site/front-matter.md` from the front matter keys the engine reads.

## Files

**Create**
- `tools/front-matter-ref/run.mjs`
- `tools/front-matter-ref/run.test.mjs`

**Edit**
- `site/front-matter.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Source of truth is a JSON Schema in `packages/engine/schema/front-matter.schema.json`; create it in this task.

## Done when
- [ ] `npm run check` passes.
