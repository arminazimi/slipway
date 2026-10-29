Copy everything here except this README into your site: `AGENTS.md`, `.vscode/`, `search.json`, and `404.md`.
Enable `jekyll-feed` and `jekyll-sitemap` in `_config.yml` for `/feed.xml` and `/sitemap.xml`; GitHub Pages supports both.
Multilingual sites may keep Slipway feed and sitemap layout stubs instead; see [the mode guide](../docs/modes.md#starter-files).

The CLI generates `content-schemas.json`, which indexes the local `schema/` directory copied by create-slipway. The CLI also copies `_plugins/` for source maps and Markdown twins during local or Actions builds; classic GitHub Pages safe mode ignores custom plugins. The starter targets agent-editable L2, checked with `npx slipway doctor . --build _site --level L2` after building. L3 discovery and schema style warnings are outside that target.
