---
# For agents that edit this site, not for readers: published: false keeps it out of the built site.
title: Agent guide
published: false
---

# AGENTS.md

How to edit this site. It is a Jekyll site built with the Slipway theme; you edit Markdown and YAML, and the theme does the rest. Read this file before every task.

## Layout

- `_config.yml`: site settings (title, description, language, theme, social links).
- `index.md`: the home page, which lists the newest case studies.
- `_posts/`: the case studies, newest first by file name.
- `work.md`: the archive page that lists every case study by year.
- `about.md` and `contact.md`: `layout: page`.
- `_data/navigation.yml`: the header menu (`main`).
- `_site/`: the built site. It is generated; never edit it.

## Schemas

Front matter and config are checked against JSON Schemas in the theme. Use only the keys they list:

- Config: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/slipway-config.schema.json
- Menus: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/navigation.schema.json
- Front matter, one schema per layout: https://github.com/arminazimi/slipway/tree/main/schema/front-matter

The `layout` key picks the front matter schema: here it is `home`, `post`, `archive`, or `page`. Every page needs `title`; add `description`.

## Add a case study

Create `_posts/<YYYY-MM-DD>-<slug>.md`. The file name gives the post its date and its address, so never rename a post to change its title; set `title` instead.

```markdown
---
title: A booking flow for a small airline
description: One sentence for search results and the archive.
layout: post
tags: [case-study, research]
---

## The problem
```

Use the same four headings every time: `## The problem`, `## What we did`, `## What shipped`, `## The result`.

## Add a page

Create `<page>.md` with `layout: page` and add it to `main` in the navigation file if it belongs in the header.

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
- Never invent front matter keys or config keys; add only keys the schemas list.
- Never publish a client's confidential numbers; ask before you add a result.
