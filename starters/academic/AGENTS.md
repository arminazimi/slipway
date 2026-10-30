---
# For agents that edit this site, not for readers: published: false keeps it out of the built site.
title: Agent guide
published: false
---

# AGENTS.md

How to edit this site. It is a Jekyll site built with the Slipway theme; you edit Markdown and YAML, and the theme does the rest. Read this file before every task.

## Layout

- `_config.yml`: site settings (title, language, theme, tokens).
- `index.md`: the home page. Every other Markdown file with front matter is a page too.
- `publications.md`, `talks.md`, `teaching.md`, `cv.md`: the academic pages, each grouped by year or section.
- `_site/`: the built site. It is generated; never edit it.

```text
<folder>/<page>.md         a page, served at /<folder>/<page>.html
_data/navigation.yml       menus: main (the header), docs (the doc sidebar)
_data/i18n/<lang>.yml      interface strings for a language the theme does not ship
```

## Schemas

Front matter and config are checked against JSON Schemas in the theme. Use only the keys they list:

- Config: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/slipway-config.schema.json
- Menus: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/navigation.schema.json
- Front matter, one schema per layout: https://github.com/arminazimi/slipway/tree/main/schema/front-matter

The `layout` key picks the front matter schema: `page`, `post`, `doc`, `home`, or `archive`. Every page needs `title`; add `description`.

## Add a publication

Put it under the year heading in `publications.md`, newest year first, and number it within that section. Keep the pattern the page already uses: authors, (year), *title*, venue, pages.

```markdown
## 2026

1. Farhadi, L., & Okafor, N. (2026). *A new paper*. Journal of Open Source Linguistics, 5(1), 1–10.
```

Never add a year heading out of order, and never invent authors, venues, or page ranges: copy them from the paper.

## Add a talk

Put it under the year heading in `talks.md`, newest first, as a bold title followed by the venue and month:

```markdown
- **A new talk.** RTL Web Workshop, Berlin, March 2026. Invited talk.
```

## Add a course

Add a `##` heading with the course name in `teaching.md`, newest first, then a semester line and the description:

```markdown
## Course name

*Semester:* Fall 2026 · *Level:* Graduate

What the course covers, in one or two paragraphs.
```

## Update the CV

`cv.md` has four sections: Education, Appointments, Awards, Service. Add each entry as a bold title followed by the institution or body and the year, and keep each section newest first. Mark ongoing roles with `–present`.

## Add a navigation item

Add an entry to the `main` list of `_data/navigation.yml`. `url` is the page's address, not its file:

```yaml
main:
  - title: Blog
    url: /blog.html
```

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
- Never invent a citation, a date, an award, or a talk; this site is a record, so wrong facts are worse than missing ones.
- Never reorder the year headings in `publications.md` or `talks.md`; newest first is the convention here.
- Never invent front matter keys or config keys; add only keys the schemas list.
- Never delete a page that has front matter but no text, such as the search index or the sitemap; the theme needs it.
