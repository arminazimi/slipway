## Goal
Works on Jekyll 4 outside GitHub Pages (Netlify, Cloudflare Pages, plain `jekyll build`); CI matrix with 3.10 and 4.x.

## Agent brief

**Context**
Many hosts (Netlify, Cloudflare Pages, Vercel) run plain Jekyll 4, not the `github-pages` gem. The gemspec allows `>= 3.9, < 5.0`, but only 3.10 is tested. Jekyll 4 uses kramdown 2 and sass-embedded through `jekyll-sass-converter` 3; differences in Liquid filters and the Sass converter are the usual breakage.

**Steps**
1. Add `tools/theme/gemfiles/jekyll4.gemfile` with `jekyll ~> 4.3`, `jekyll-feed`, `jekyll-sitemap`, `jekyll-remote-theme`, and the `gemspec`, and commit its lockfile.
2. Let `tools/theme/build.mjs` read `BUNDLE_GEMFILE` so the same build runs against either Gemfile.
3. Build every example on Jekyll 4 and fix what differs, without breaking 3.10 (no Jekyll 4-only filters).
4. Add a CI matrix (`pages` and `jekyll4`) to `.github/workflows/ci.yml`; the `jekyll4` job runs `npm run check:site`.
5. Add a row for Jekyll 4 to `docs/modes.md`.

**Files**
- `tools/theme/gemfiles/`
- `tools/theme/build.mjs`
- `.github/workflows/ci.yml`
- `docs/modes.md`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not raise the minimum Jekyll version in the gemspec.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] CI runs the site check on Jekyll 3.10 (Pages gem) and 4.x, and both pass.
- [ ] Built HTML of the minimal example differs only in generator meta and whitespace between the two (a test compares them).
- [ ] `docs/modes.md` lists Jekyll 4.
