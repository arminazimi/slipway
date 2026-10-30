---
# For agents that edit this site, not for readers: published: false keeps it out of the built site.
title: Agent guide
published: false
---

# AGENTS.md

How to edit this site. It is a Jekyll site built with the Slipway theme; you edit Markdown and YAML, and the theme does the rest. This site has two languages, English at `/` and Persian at `/fa/`, and every page exists in both. Read this file before every task.

## Layout

- `_config.yml`: site settings (title, language, theme, languages, tokens).
- `index.md`: the English home page; `fa/index.md` is its Persian translation.
- `_site/`: the built site. It is generated; never edit it.

```text
<folder>/<page>.md         an English page, served at /<folder>/<page>.html
fa/<folder>/<page>.md      its Persian translation, served under /fa/
_data/navigation.yml       menus: main (the English header) and main_fa (the Persian header)
_data/i18n/<lang>.yml      interface strings for a language the theme does not ship
```

## Schemas

Front matter and config are checked against JSON Schemas in the theme. Use only the keys they list:

- Config: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/slipway-config.schema.json
- Menus: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/navigation.schema.json
- Front matter, one schema per layout: https://github.com/arminazimi/slipway/tree/main/schema/front-matter

The `layout` key picks the front matter schema: `page`, `post`, `doc`, `home`, or `archive`. Every page needs `title`; add `description`. The keys every layout accepts include `lang`, `direction` (`ltr` or `rtl`), `tags`, `nav_order`, `permalink`, and `translation_key`.

## Add a page in both languages

1. Create the English page, `/` for the default language:

```markdown
---
title: Support
description: How to reach us.
layout: page
translation_key: support
permalink: /support.html
---
```

2. Copy it to `fa/support.md` and set its language and address:

```markdown
---
title: پشتیبانی
description: راه‌های تماس با ما.
layout: page
lang: fa
translation_key: support
permalink: /fa/support.html
---
```

3. Give both pages the same `translation_key`; that is what links them in the language switcher. Translate the body; never leave an English sentence in a Persian page.

Right-to-left languages are laid out right to left from `lang`; set `direction` only to override it. In Persian text, use the Persian `ی` and `ک`, a zero-width non-joiner in words such as `می‌شود`, and Persian punctuation (`،` and `؟`).

## Add a navigation item

Add an entry to `main` for the English page and the matching entry to `main_fa` for the Persian one, so the two menus keep pointing at the same pages. `url` is the page's address, not its file:

```yaml
main:
  - title: Support
    url: /support.html
main_fa:
  - title: پشتیبانی
    url: /fa/support.html
```

A language other than the default gets its own list, `main_<lang>`, such as `main_fa`. The doc sidebar is the `docs` list, in reading order.

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
- Never change `translation_key` on one translation only; change every page that shares it, or none.
- Never add an English page without its Persian copy, or the other way around; the switcher falls back to the language home instead of the translation.
- Never invent front matter keys or config keys; add only keys the schemas list.
- Never delete a page that has front matter but no text, such as the search index or the sitemap; the theme needs it.
