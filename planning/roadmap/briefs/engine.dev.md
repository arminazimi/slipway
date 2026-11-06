## Goal
A local server that rebuilds on change and reloads the browser.

## Files

**Create**
- `packages/engine/src/cli/dev.ts`
- `packages/engine/test/dev.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Node's `http` server; file watching with `fs.watch` recursive.
2. Server-sent events for reload; the script is injected only in dev.

## Done when
- [ ] Changing one page rebuilds in under 500 ms on `fixtures/docs-site`.
- [ ] `npm run check` passes.
