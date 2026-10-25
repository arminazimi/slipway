## Goal
Publish the spec as a versioned site, with its JSON Schemas at stable URLs.

## Agent brief

**Context**
The spec (`spec/agent-editable/`) and its JSON Schemas must have URLs that never change, so a site can write `"$schema": "https://.../0.1/sourcemap.schema.json"`. The spec site is itself a Slipway site on GitHub Pages, which also dogfoods the theme.

**Steps**
1. Add a `docs-site/` Jekyll source using the `doc` layout that renders `spec/agent-editable/*.md` under `/spec/0.1/`.
2. Copy every schema to `/spec/0.1/<name>.schema.json` at build time and set each schema's `$id` to that URL; add a test that `$id` matches the path.
3. Add `.github/workflows/pages.yml` that builds `docs-site/` and deploys it with `actions/deploy-pages` on push to `main`.
4. Add `/spec/latest/` as a page that links to the current version; old versions stay in place forever.

**Files**
- `docs-site/`
- `spec/agent-editable/`
- `schema/*.schema.json` (`$id` only)
- `.github/workflows/pages.yml`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not change repository settings; enabling Pages in Actions mode is a maintainer step, write it in the pull request description.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] `npm run check` builds the spec site and checks every `$id`.
- [ ] Every schema is reachable at its `$id` path in the built output.
- [ ] The site passes the same checks as the examples.
