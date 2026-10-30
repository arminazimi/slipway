---
# For agents that edit this site, not for readers: published: false keeps it out of the built site.
title: Agent guide
published: false
---

# AGENTS.md

How to edit this site. It is a Jekyll site built with the Slipway theme; you edit Markdown and YAML, and the theme does the rest. Read this file before every task.

The site documents two versions of one tool: `v2/` is current, `v1/` is legacy. The sidebar in `_data/navigation.yml` lists both versions as groups, so the version bar is the navigation itself.

## Layout

- `_config.yml`: site settings (title, language, theme, tokens).
- `index.md`: the home page.
- `v2/`, `v1/`: one folder per version, with the same pages in each: overview (`index.md`), install, and commands.
- `_site/`: the built site. It is generated; never edit it.

```text
v2/<page>.md               a version 2 page, served at /v2/<page>.html
v1/<page>.md               its version 1 counterpart, served at /v1/<page>.html
_data/navigation.yml       menus: main (the header), docs (the doc sidebar, grouped by version)
```

## Schemas

Front matter and config are checked against JSON Schemas in the theme. Use only the keys they list:

- Config: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/slipway-config.schema.json
- Menus: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/navigation.schema.json
- Front matter, one schema per layout: https://github.com/arminazimi/slipway/tree/main/schema/front-matter

## Add a docs page

Add the page to both versions so the guides stay parallel. Use `layout: doc` and an explicit `permalink` under the version prefix:

```markdown
---
title: Configuration
description: Every setting and its default.
layout: doc
permalink: /v2/config.html
---
```

Then add it to that version's group in the `docs` list of `_data/navigation.yml`, under the matching children list for `/v2/`, and give the version 1 page its own entry.

## Add a version

1. Create a folder named after the version, such as `v3/`, and give each page a permalink under it.
2. Add a group to `docs` with a heading such as `Version 3 (latest)` and one child per page.
3. Add a line to the home page saying which version is current, and a `> **... no longer maintained.**` note on the old version's pages that links to the new guide.
4. Rename the old group's heading so it says `(legacy)`.

## Keep the sidebar honest

- Every page under `v1/` or `v2/` appears exactly once in the `docs` list; a page missing from it is unreachable except by URL.
- Every URL in `main` and `docs` points at a page that exists.
- The version 1 pages open with the legacy note, and the note links to `/v2/`.

## Check your edit

After each edit, build the site and read every error and warning:

```sh
bundle exec jekyll build
npx slipway doctor . --build _site --level L2
```

Each message names a file and often a line. Fix it there, build again, and repeat until the build is clean. If the site has no Gemfile, GitHub Pages builds it on push: check the front matter against the schemas above instead, and read the build log of the Pages run.

## Never

- Never edit `_site/`; the next build replaces it.
- Never put Liquid (`{{ }}` or `{% %}`) in page content; write plain Markdown and let the layouts do the logic.
- Never document a command the tool does not have; these pages are the reference, so a wrong flag is worse than a missing one.
- Never add a page to one version only; the two guides describe the same feature set, and the sidebar shows where they differ.
- Never rename a page's permalink without adding a redirect; the old URL is what search results and links point at.
- Never invent front matter keys or config keys; add only keys the schemas list.
- Never delete a page that has front matter but no text, such as the search index or the sitemap; the theme needs it.
