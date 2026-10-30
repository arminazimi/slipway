---
# For agents that edit this site, not for readers: published: false keeps it out of the built site.
title: Agent guide
published: false
---

# AGENTS.md

How to edit this site. It is a Jekyll site built with the Slipway theme; you edit Markdown and YAML, and the theme does the rest. Read this file before every task.

## Layout

- `_config.yml`: site settings (title, description, language, theme).
- `index.md`: the landing page.
- `docs/`: the guide, one page per command group, each with `layout: doc` and a `permalink`.
- `changelog.md`: the release page, `layout: changelog`.
- `_data/navigation.yml`: the header (`main`) and the docs sidebar (`docs`).
- `_site/`: the built site. It is generated; never edit it.

## Schemas

Front matter and config are checked against JSON Schemas in the theme. Use only the keys they list:

- Config: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/slipway-config.schema.json
- Menus: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/navigation.schema.json
- Front matter, one schema per layout: https://github.com/arminazimi/slipway/tree/main/schema/front-matter

The `layout` key picks the front matter schema: here it is `home`, `doc`, `changelog`, or `page`. Every page needs `title`; add `description`. Documentation pages need a `permalink` so the sidebar links do not change when the file moves.

## Add a documentation page

Create `docs/<page>.md` with a `permalink`, then add it to the `docs` list in the navigation file under the right group:

```markdown
---
title: Configuration
description: Every key in .orbit.json.
layout: doc
permalink: /docs/config/
---

## Keys
```

## Add a command to the reference

Commands live in one table per command in `docs/commands.md`, with the flags and the exit codes. The theme has no CLI reference layout yet, so the table is plain Markdown; keep the order the same as `orbit --help`.

## Add a release

Add a new `## <version> — <YYYY-MM-DD>` section at the top of `changelog.md`, above the last release, with `### Added`, `### Changed`, and `### Fixed` lists. Leave older releases alone.

## Check your edit

After each edit, build the site and read every error and warning:

```sh
bundle exec jekyll build
npx slipway doctor . --build _site --level L2
```

Each message names a file and often a line. Fix it there, build again, and repeat until the build is clean.

## Never

- Never edit `_site/`; the next build replaces it.
- Never put Liquid (`{{ }}` or `{% %}`) in page content; write plain Markdown and let the layouts do the logic.
- Never change a `permalink` without adding the old URL to `redirect_from` on the same page; the old link must keep working.
- Never invent front matter keys or config keys; add only keys the schemas list.
- Never delete `search.json`, `sitemap.xml`, `llms.txt`, or `llms-full.txt`; the theme fills them in.
