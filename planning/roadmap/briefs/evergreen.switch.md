> [!IMPORTANT]
> This pull request goes to **arminazimi/evergreen**, not to Slipway. Link it here with `Closes arminazimi/slipway#<this issue>`.

## Goal
Evergreen's documentation site moves from `jekyll-theme-minimal` to Slipway with no lost URL and no change to Evergreen's generators.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `docs/_data/navigation.yml` (from the "Start here" list in `docs/index.md`)
- the Slipway stubs Evergreen needs (`search.json`, `404.md`), copied from Slipway's stubs folder

**Edit**
- `docs/_config.yml` (`theme:` becomes `remote_theme: arminazimi/slipway@v0.2.0` with `jekyll-remote-theme`; `defaults` give every page `layout: doc`; brand colors go into `slipway.tokens`; `slipway.source_dir: docs`)
- `docs/index.md` (use the `home` layout's fields for the kicker and tagline)
- `docs/assets/css/style.scss` (delete; it imports the old theme)

## Steps
1. Keep `docs/llms.txt`, `docs/llms-full.txt`, `docs/sitemap.xml`, `docs/rules/`, and `docs/dashboard/` exactly as Evergreen's tools write them.
2. Build with the GitHub Pages gem (`bundle exec jekyll build -s docs`) and compare the URL list with the old `sitemap.xml`.
3. Run Evergreen's own checks, including `node dist/tools/build-reference-pages.js --check`.
4. Open the pull request in arminazimi/evergreen and link this issue (`Closes arminazimi/slipway#<this issue>`).

## Done when
- [ ] Every URL in the old `sitemap.xml` exists in the new build.
- [ ] Evergreen's CI passes, and each page has one `h1`.
