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
- `notes/`: one note per file. `garden.md` is the index of all of them.
- `_includes/garden-backlinks.html`: the backlink list at the end of every note.
- `_site/`: the built site. It is generated; never edit it.

Files a site creates when it needs them:

```text
_posts/<date>-<slug>.md    a post; <date> is YYYY-MM-DD
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

## Add a note

Create `notes/<slug>.md`:

```markdown
---
title: A title that says the claim
description: The claim in one sentence.
layout: page
note: a-short-key
stage: seedling
planted: 2026-10-30
tended: 2026-10-30
links: [another-note-key]
---

The note, in plain Markdown.

## Linked from

{% raw %}{% include garden-backlinks.html %}{% endraw %}
```

`stage` is `seedling`, `budding`, or `evergreen`. `note` is the key other notes use in their `links`; keep it stable when the title changes. Update `tended` whenever the note's content changes.

## Link between notes

A link in the body is Markdown, with the page address:

```markdown
See [stages of growth](/notes/stages-of-growth.html).
```

Then add the target's `note` key to this note's `links`, so the backlink list on the target finds this note.

## Add a page

Create `<folder>/<page>.md` with `title`, `description`, and `layout: page`, then add it to `_data/navigation.yml` if it belongs in the header.

## Check an edit

- `slipway doctor .` reports what the site is missing. Warnings from `jekyll.liquid-in-content` are expected: `garden.md` and the notes use Liquid to build the index and the backlinks.
- `npm run check` runs the theme's tests.

Never edit `_site/` or `CHANGELOG.md`; never change the theme files.
