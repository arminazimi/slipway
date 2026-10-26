# AGENTS.md

How to edit this site. It is a Hugo site; you edit Markdown under `content/` and the settings in `hugo.toml`. Read this file before every task.

## Layout

- `hugo.toml`: site settings (title, address, languages, menus, theme).
- `content/`: the pages. `content/_index.md` is the home page; `content/<section>/_index.md` introduces a section; every other Markdown file is a page.
- `public/`: the built site. Hugo writes it on every build; never edit it.
- `content-schemas.json`: which JSON Schema checks which file. The schemas are in `schema/`.

## Add a page

Create `content/<section>/<slug>.md`, served at `/<section>/<slug>/`:

```markdown
---
title: About us
description: Who we are, in one sentence.
---

Plain Markdown here.
```

Use only the front matter keys in `schema/front-matter.schema.json`. Put values the theme reads under `params` unless the schema lists them.

## Check your edit

```sh
hugo --gc --minify
npx slipway doctor . --build public
```

The second command checks the site against the agent-editable spec. Fix every error before you finish.

## Never

- Never edit `public/`; your change is lost on the next build.
- Never rename a page's file without adding its old address to `aliases`.
- Never remove `sourcemap` or `markdown` from `outputs` in `hugo.toml`: they write `public/sourcemap.json` and the Markdown copy of each page that agents read.
