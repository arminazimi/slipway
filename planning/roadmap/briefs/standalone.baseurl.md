## Goal
Project sites under `/<repo>/` and custom domains: every URL respects `baseurl`, tested in CI.

## Agent brief

**Context**
Most GitHub Pages sites are project sites served under `/<repo>/`. `tools/theme/build.mjs` builds every example with `--baseurl ""`, so a hard-coded `/` path in a layout is never caught. Read `_includes/head.html` (it already uses `relative_url`) and `_includes/layout-url.html`.

**Steps**
1. Grep `_layouts/` and `_includes/` for `href="/`, `src="/`, `url: "/`, and Liquid URLs that skip `relative_url` or `absolute_url`; fix each one.
2. Let `buildExample` take an optional baseurl (default `""`) and add a test that builds `examples/docs` and `examples/blog` with `--baseurl /slipway`.
3. In that build, assert that every root-relative `href`, `src`, and `srcset` in the HTML starts with `/slipway/`, and that `feed.xml`, `sitemap.xml`, and `search.json` contain only `/slipway/` URLs.
4. Assert that `site.url` plus `baseurl` produce correct absolute URLs in the feed and the sitemap (custom domain case: `url: https://example.org`, `baseurl: ""`).

**Files**
- `_layouts/`, `_includes/`
- `tools/theme/build.mjs`
- a new `tools/theme/baseurl.test.mjs`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not add a config key; `baseurl` and `url` are Jekyll's own.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] The baseurl test builds two examples under `/slipway/` and finds no URL outside it.
- [ ] Search results and the language switcher work under the prefix (their URLs carry it).
- [ ] `npm run check` passes with the new test.
