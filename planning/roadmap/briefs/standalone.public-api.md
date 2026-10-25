## Goal
ADR: the public API under semver (config keys, front matter, layouts, include names, CSS tokens) and the deprecation policy.

## Agent brief

**Context**
Slipway 1.0 promises that a minor release never breaks a site. That needs a written list of what counts as public. Read `docs/adr/0010-ui-strings-and-language-urls.md` for the ADR style and `schema/slipway-config.schema.json` for the config keys that exist.

**Steps**
1. Write `docs/adr/0012-public-api.md` (Status, Context, Decision, Consequences, like the other ADRs).
2. List the public surface in tables: config keys (from the config schema), front-matter fields per layout, layout names, include names and their parameters, CSS custom properties from `tokens/theme.tokens.json`, and generated URLs (`/feed.xml`, `/search.json`, `/sitemap.xml`).
3. State the rules: what a patch, minor, and major release may change; a deprecated item keeps working for at least one minor release and warns with its replacement; internals (anything not listed) may change.
4. Add the ADR to the table in `docs/adr/README.md` and link it from `README.md`.

**Files**
- `docs/adr/0012-public-api.md`
- `docs/adr/README.md`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not list anything as public that the tests do not cover; write 'not yet tested' and open an issue instead.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] The ADR lists every config key in the config schema and every token name, and says which are public.
- [ ] The deprecation rule is stated with a concrete example.
- [ ] `npm run check` passes.
