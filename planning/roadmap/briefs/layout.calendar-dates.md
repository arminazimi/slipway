## Goal
Show "last updated" in the Persian (Jalali) calendar on Persian pages and the Hijri calendar on Arabic pages, from the ISO date the engine gives (Lateen differentiator 6).

## Files

**Create**
- `packages/theme/src/dates.ts`
- `packages/theme/test/dates.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Use `Intl.DateTimeFormat` with the `persian` and `islamic` calendars; no dependency.
2. Keep the ISO date in a `datetime` attribute.

## Done when
- [ ] Known dates format correctly in `fa`, `ar`, and `en` (tested).
- [ ] `npm run check` passes.
