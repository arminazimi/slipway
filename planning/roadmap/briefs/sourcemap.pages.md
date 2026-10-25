## Goal
Page-to-file map in GitHub Pages classic, using Liquid's `page.path`.

## Agent brief

**Context**
ADR 0007 level 0: a Liquid page can emit `{ url, source }` for content pages with no tooling. It must not list generated files (stylesheets, twin stubs).

**Steps**
1. Add `sourcemap.json` as a stub page using a new `sourcemap` layout in `_layouts/`; loop over `site.pages`, `site.posts`, and `site.documents` and skip files whose `path` is under `assets/` or ends in `.xml`, `.json`, `.css`, or is a twin stub.
2. Emit the format from `sourcemap.contract` with `"mode": "pages"`.
3. Add the stub to `starter-files/` and to every example.
4. Test: build `examples/docs` and `examples/blog`, parse the JSON, validate it against the schema, and assert that a post and a doc map to their real `_posts/...` and `_docs/...` paths.

**Files**
- `_layouts/sourcemap.html`
- `starter-files/`
- `examples/*`
- `tools/theme/sourcemap.test.mjs`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not compute lines in Liquid (ADR 0007 rejects it); omit `sections` at this level.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] Every example publishes a `sourcemap.json` that validates against the schema.
- [ ] No generated file appears in it.
- [ ] JSON stays valid for titles with quotes and Persian text.
