## Goal
Cut the files every site must copy (feed, search index, sitemap, 404) to a minimum, shipped as one copyable folder.

## Agent brief

**Context**
Today a site that uses `remote_theme` must copy `feed.xml`, `search.json`, `sitemap.xml`, `404.md`, and tag pages because Pages does not serve theme files at those URLs. Look at what `examples/minimal` copies.

**Steps**
1. Inventory every file an example copies from the theme and why (read `docs/modes.md` and ADR 0006).
2. Remove the ones the `jekyll-feed` and `jekyll-sitemap` plugins can generate; keep only what has no plugin.
3. Create `starter-files/` with the remaining stubs, each a front-matter-only file that selects a layout, plus a README of three lines.
4. Make `examples/bare` and `examples/minimal` use that folder, and add a test that every stub's layout exists.

**Files**
- `starter-files/`
- `examples/*`
- `docs/modes.md` (update the table)

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not change the URLs the stubs serve.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] A new site copies one folder (or fewer than five files) and gets feed, search, sitemap, and a 404.
- [ ] The URLs are unchanged and the existing example tests pass.
- [ ] `docs/modes.md` matches the new setup.
