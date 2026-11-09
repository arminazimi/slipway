## Goal
Delete old gate folders replaced by engine gates (`tools/nojs`, `tools/html-validate`, `tools/page-weight`, `tools/a11y`, and others that build with Jekyll), or point them at the fixture build.

## Files

**Edit**
- `tools/nojs/run.ts`
- `tools/html-validate/run.ts`
- `tools/page-weight/run.ts`
- `tools/a11y/run.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. For each `tools/*/run.mjs`, decide: delete (replaced) or repoint to `tools/fixture-build`. List the decision per folder in the pull request.

## Done when
- [ ] No gate builds with Jekyll.
- [ ] `npm run check` passes.
