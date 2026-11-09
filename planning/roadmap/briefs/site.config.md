## Goal
Add `site/mizzen.yml` and deploy the site with `action/deploy`.

## Files

**Create**
- `site/mizzen.yml`

**Edit**
- `.github/workflows/deploy-site.yml`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Delete `site/_config.yml` and `site/_config.remote.yml` after converting them with the migration mapping (ADR 0024). The engine's config file is `mizzen.yml` (ADR 0025).

## Done when
- [ ] The site builds with zero errors and the preview deploy works.
- [ ] `npm run check` passes.
