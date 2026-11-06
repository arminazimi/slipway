## Goal
Every page knows its `lang` and `dir` from front matter, path prefix, or config, so right-to-left is handled in the engine and not only in CSS.

## Files

**Create**
- `packages/engine/src/content/lang.ts`
- `packages/engine/test/lang.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Order: front matter, `/fa/`-style path prefix listed in config, site `lang`.
2. `dir` from a built-in list of right-to-left languages unless set.

## Done when
- [ ] Every page in `fixtures/rtl-site` is `fa` and `rtl` (tested).
- [ ] `npm run check` passes.
