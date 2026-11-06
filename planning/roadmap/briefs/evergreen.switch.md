## Goal
This pull request goes to **arminazimi/evergreen**. Run the migration on Evergreen's `docs/`, deploy with `action/deploy` pinned to a commit of this repository, and prove nothing broke.

## Files

- `docs/` (migration output)
- `.github/workflows/pages.yml` (or the workflow that deploys docs)

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Run `npx slipway migrate docs` and commit the result.
2. Replace the Jekyll Pages deploy with `action/deploy`.
3. Run URL parity against the live sitemap; attach the report.
4. Attach before and after screenshots of five pages.

## Done when
- [ ] The pull request is merged and the live site is the engine build.
- [ ] The URL parity report shows zero missing URLs.
