---
# For agents that edit this site, not for readers: published: false keeps it out of the built site.
title: Agent guide
published: false
---

# AGENTS.md

How to edit this site. It is a Jekyll site built with the Slipway theme; you edit Markdown and YAML, and the theme does the rest. Read this file before every task.

## Layout

- `_config.yml`: site settings (title, description, language, theme, social links).
- `index.md`: the project's landing page.
- `docs/`: the documentation, each page with `layout: doc` and a `permalink`.
- `contributing.md` and `support.md`: `layout: page`, linked from the header.
- `_data/navigation.yml`: the header (`main`) and the docs sidebar (`docs`).
- `_site/`: the built site. It is generated; never edit it.

## Schemas

Front matter and config are checked against JSON Schemas in the theme. Use only the keys they list:

- Config: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/slipway-config.schema.json
- Menus: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/navigation.schema.json
- Front matter, one schema per layout: https://github.com/arminazimi/slipway/tree/main/schema/front-matter

The `layout` key picks the front matter schema: here it is `home`, `doc`, or `page`. Every page needs `title`; add `description`.

## Add a documentation page

Create `docs/<page>.md`, give it a `permalink`, and add it to the `docs` list in the navigation file:

```markdown
---
title: Plugins
description: How to write a store.
layout: doc
permalink: /docs/plugins/
---

## Write a store
```

## Change the API reference

`docs/api.md` documents each export in its own `##` section, with a table of options. When an option changes, change the table and the version in `package.json` together.

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
- Never change a `permalink` without adding the old URL to `redirect_from` on the same page.
- Never invent front matter keys or config keys; add only keys the schemas list.
- Never publish a security report; link the maintainer address in `package.json` instead.
