## Goal
Each page loads base styles plus the `style.css` of the chrome and components it actually used, minified with Lightning CSS.

## Files

**Create**
- `packages/engine/src/render/css.ts`
- `packages/engine/test/css.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. One shared base bundle plus a per-combination bundle, hashed and cached.
2. Logical properties are kept; no RTL flipping step.

## Done when
- [ ] A page with no code blocks loads no code CSS (tested).
- [ ] `npm run check` passes.
