---
# For agents that edit this site, not for readers: published: false keeps it out of the built site.
title: Agent guide
published: false
---

# AGENTS.md

How to edit this site. It is a Jekyll site built with the Slipway theme; you edit Markdown and YAML, and the theme does the rest. Read this file before every task.

## Layout

- `_config.yml`: site settings (title, language, theme, url, author).
- `index.md`: the home page. It lists every episode.
- `_site/`: the built site. It is generated; never edit it.

Files the show is made of:

```text
_posts/<date>-<slug>.md    an episode; <date> is YYYY-MM-DD
transcripts/<episode>.md    the transcript of an episode
audio/<episode>.mp3         the recording of an episode
feed.xml                    the RSS feed with the iTunes namespace
```

Everything else is a page:

```text
<folder>/<page>.md         a page, served at /<folder>/<page>.html
_data/navigation.yml       menus: main (the header)
_data/authors.yml          the hosts of the show
_data/i18n/<lang>.yml      interface strings for a language the theme does not ship
```

The agent-skills index, in `.well-known/agent-skills/`, tells an agent what it can do with this
site. It names a skill per file there; keep its `name` and `description` in step with the file.

## Schemas

CLI starters include `content-schemas.json` and local schemas for offline checks. This site has both:
`content-schemas.json` says which JSON Schema checks which file, and `schema/` holds those schemas.
Front matter and config are checked against JSON Schemas in the theme. Use only the keys they list:

- Config: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/slipway-config.schema.json
- Menus: https://raw.githubusercontent.com/arminazimi/slipway/main/schema/navigation.schema.json
- Front matter, one schema per layout: https://github.com/arminazimi/slipway/tree/main/schema/front-matter

The `layout` key picks the front matter schema: `page`, `post`, `doc`, `home`, or `archive`. Every page needs `title`; add `description`. The keys every layout accepts include `lang`, `direction` (`ltr` or `rtl`), `tags`, `nav_order`, `permalink`, and `translation_key`.

## Add an episode

Create `_posts/<date>-<slug>.md`. The file name gives the episode its date; `permalink` gives it its address.

```markdown
---
title: The second episode
description: One sentence about the episode.
layout: post
author: ada
permalink: /episodes/episode-2/
season: 1
number: 2
audio: /audio/episode-2.mp3
audio_type: audio/mpeg
audio_length: 32109
duration: 2
explicit: false
tags: [markdown]
---
```

`audio` is the recording, `audio_length` its size in bytes, and `duration` its length in seconds. The
feed needs all three. Put the file in `audio/` and add the transcript as `transcripts/<episode>.md`.

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

## Add a navigation item

Add an entry to the `main` list of `_data/navigation.yml`:

```yaml
main:
  - title: About
    url: /about.html
```

The doc sidebar is the `docs` list, in reading order.

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
npx slipway doctor . --build _site --level L3
```

This site targets L3 after a build that runs its plugins: they write the source map, the Markdown
twins, and the agent-skills index. On classic GitHub Pages, where GitHub runs no plugins, the site
still builds and reaches L1. Doctor checks structure and schemas; broken content links at Markdown
lines are the separate Seaworthy integration tracked in Slipway #69.

Each message names a file and often a line. Fix it there, build again, and repeat until the build is clean. If the site has no Gemfile, GitHub Pages builds it on push: check the front matter against the schemas above instead, and read the build log of the Pages run.

## Never

- Never edit `_site/`; the next build replaces it.
- Never put Liquid (`{{ }}` or `{% %}`) in page content; write plain Markdown and let the layouts do the logic.
- Never change `translation_key` on one translation only; change every page that shares it, or none.
- Never invent front matter keys or config keys; add only keys the schemas list.
- Never delete a page that has front matter but no text, such as the feed or the search index; the theme needs it.
- Never rename a post's file to change its title; set `title` instead, because the file name is its address.
- Never change the address of an episode without keeping `feed.xml` and the episode's own link in step.
- Never leave `audio_length` or `duration` out of an episode; the feed needs both.
