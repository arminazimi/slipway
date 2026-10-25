## Goal
A site with only `remote_theme` and a title builds and looks right; a new `examples/bare` proves it.

## Agent brief

**Context**
Today every example carries `_data`, stub pages, and a long `_config.yml`. A project that adopts Slipway should need one line. Read `docs/modes.md` and `examples/minimal/_config.remote.yml` first.

**Steps**
1. Add `examples/bare` with `_config.yml` containing only `remote_theme: arminazimi/slipway` and `title`, plus one `index.md`.
2. Build it with `node tools/theme/build.mjs remote examples/bare` and fix every place the theme assumes a missing file or key (navigation, social, i18n strings, `site.data`): fall back to a default, never fail the build.
3. Add a test next to `tools/theme/base-layout.test.mjs` that builds `bare` and asserts a 200-style page: `<title>`, header, footer, working skip link, no `undefined` or empty links in the HTML.
4. Register `bare` in `tools/theme/check.mjs` so `npm run check` builds it with the other examples.

**Files**
- `examples/bare/`
- `_layouts/`, `_includes/` (defaults only)
- `tools/theme/check.mjs`, a new `tools/theme/bare.test.mjs`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not add config keys; use defaults for what is missing.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] `examples/bare` has exactly two files besides the lockfile: `_config.yml` (two keys) and `index.md`.
- [ ] It builds in the Pages gem and passes the same checks as the other examples.
- [ ] No page of it contains an empty `href`, `undefined`, or an unrendered Liquid tag.
