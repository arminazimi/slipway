## Goal
Delete `site/audio/`, `site/compare/`, `site/languages.md`, and `site/roadmap` generation, and redirect their URLs to the home page.

## Files

**Edit**
- `site/languages.md`
- `site/compare/index.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Remove `planning/roadmap/page.mjs` output to `site/` (keep the roadmap in `ROADMAP.md` only).
2. Add redirects for removed URLs in `site/slipway.yml`.

## Done when
- [ ] `npm run check` passes.
