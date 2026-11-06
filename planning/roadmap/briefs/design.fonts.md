## Goal
Ship the fonts chosen in the brief as subsetted WOFF2 files with `font-display: swap` and size-adjusted fallbacks.

## Files

**Create**
- `packages/theme/fonts/`
- `packages/theme/styles/fonts.css`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Latin subset for sans and mono; Arabic-script subset for Vazirmatn.
2. License files next to the fonts.
3. Fallback metrics with `size-adjust` to limit layout shift.

## Done when
- [ ] Total font weight for a Latin page is under 120 KB.
- [ ] `npm run check` passes.
