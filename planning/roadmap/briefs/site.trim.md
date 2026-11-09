## Goal
Delete `site/audio/`, `site/compare/`, `site/languages.md`, and `site/roadmap.md`, stop generating the roadmap page, and redirect their URLs to the home page.

## Files

**Delete**
- `site/audio/`
- `site/compare/`
- `site/languages.md`
- `site/roadmap.md`
- `planning/roadmap/page.ts`
- `planning/roadmap/page.test.ts`

**Edit**
- `site/mizzen.yml`
- `site/_data/navigation.yml`
- `site/index.md`
- `site/blocks/audio.md`
- `spec/docs-site/_data/navigation.yml`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Delete the pages and the roadmap page generator; keep the roadmap in `ROADMAP.md` only.
2. Add redirects for the removed URLs in `site/mizzen.yml`.

## Done when
- [ ] `npm run check` passes.
