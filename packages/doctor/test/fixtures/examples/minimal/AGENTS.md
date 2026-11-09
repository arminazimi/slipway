---
# For agents that edit this site, not for readers: published: false keeps it out of the built site.
title: Agent guide
published: false
---

# AGENTS.md

How to edit this site. It is a Jekyll site built with the Slipway theme; you edit Markdown and YAML, and the theme does the rest. Read this file before every task.

## Layout

- `_config.yml`: site settings (title, language, theme, languages, tokens).
- `index.md`: the home page. Every other Markdown file with front matter is a page too.
- `_site/`: the built site. It is generated; never edit it.

Files a site creates when it needs them:

```text
_posts/<date>-<slug>.md    a post; <date> is YYYY-MM-DD
<folder>/<page>.md         a page, served at /<folder>/<page>.html
_data/navigation.yml       menus: main (the header), docs (the doc sidebar)
_data/i18n/<lang>.yml      interface strings for a language the theme does not ship
```

## Schemas

CLI starters include `content-schemas.json` and local schemas for offline checks. Front matter and config are checked against JSON Schemas in the theme. Use only the keys they list:

- Config: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/slipway-config.schema.json
- Menus: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/navigation.schema.json
- Front matter, one schema per layout: https://github.com/arminazimi/slipway/tree/main/schema/front-matter

The `layout` key picks the front matter schema: `page`, `post`, `doc`, `home`, or `archive`. Every page needs `title`; add `description`. The keys every layout accepts include `lang`, `direction` (`ltr` or `rtl`), `tags`, `nav_order`, `permalink`, and `translation_key`.

## Add a page

Create `<folder>/<page>.md`:

```markdown
---
title: About us
description: Who we are, in one sentence.
layout: page
---

Plain Markdown here.
```

Use `layout: doc` for documentation pages with a sidebar.

## Add a post

Create `_posts/<date>-<slug>.md`. The file name gives the post its date and its address.

```markdown
---
title: Our first release
description: What shipped and why.
layout: post
tags: [release]
---
```

## Add a navigation item

Add an entry to the `main` list of the navigation file, listed above (create it if it is missing). `url` is the page's address, not its file:

```yaml
main:
  - title: About
    url: /about.html
```

A language other than the default gets its own list, `main_<lang>`, such as `main_fa`. The doc sidebar is the `docs` list, in reading order.

## Add a translation

1. The language must be in the `languages` list under `slipway` in `_config.yml`, with a `code`, a `name`, and a `prefix` such as `/fa`.
2. Copy the page to `<prefix>/<page>.md`, a folder named after the prefix, and translate the text.
3. Set `lang` to the language code and `permalink` to an address under the prefix.
4. Give both pages the same `translation_key`. That is what links them in the language switcher.

```markdown
---
title: درباره ما
lang: fa
permalink: /fa/about.html
layout: page
translation_key: about
---
```

Right-to-left languages (`fa`, `ar`, `he`, `ur`, and others) are laid out right to left by the theme; set `direction` only to override it.

## Check your edit

After each edit, build the site and read every error and warning:

```sh
bundle exec jekyll build
npx slipway doctor . --build _site --level L2
```

CLI starters target L2 after a local build (custom plugins must be enabled). L3 skill discovery is optional. Doctor checks structure and schemas; broken content links at Markdown lines are the separate Seaworthy integration tracked in Slipway #69.

Each message names a file and often a line. Fix it there, build again, and repeat until the build is clean. If the site has no Gemfile, GitHub Pages builds it on push: check the front matter against the schemas above instead, and read the build log of the Pages run.

## Never

- Never edit `_site/`; the next build replaces it.
- Never put Liquid (`{{ }}` or `{% %}`) in page content; write plain Markdown and let the layouts do the logic.
- Never change `translation_key` on one translation only; change every page that shares it, or none.
- Never invent front matter keys or config keys; add only keys the schemas list.
- Never delete a page that has front matter but no text, such as the feed or the search index; the theme needs it.
- Never rename a post's file to change its title; set `title` instead, because the file name is its address.
