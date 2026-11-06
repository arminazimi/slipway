## Goal
Split front matter from the body, parse it as YAML, and keep the body's starting line so source positions stay exact.

## Files

**Create**
- `packages/engine/src/content/frontmatter.ts`
- `packages/engine/test/frontmatter.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Support `---` YAML front matter only.
2. Return `{ data, body, bodyLine }`.
3. Invalid YAML is a diagnostic with its line.

## Done when
- [ ] Positions in the body are correct with and without front matter (tested).
- [ ] `npm run check` passes.
