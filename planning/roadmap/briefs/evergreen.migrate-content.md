## Goal
Rewrite front matter that changed meaning (old layout names, Liquid in content, `redirect_from`) and check `_data/navigation.yml` against the engine.

## Files

**Create**
- `tools/migrate/content.ts`
- `tools/migrate/content.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Map 0.2 layout names (`doc`, `page`, `home`) to engine layouts.
2. Report Liquid tags in content with file and line; replace the ones with a direct directive equivalent (`{% include blocks/callout.html %}`).

## Done when
- [ ] `npm run check` passes.
