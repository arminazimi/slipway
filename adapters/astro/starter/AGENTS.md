# AGENTS.md

How to edit this site. It is an Astro site; you edit Markdown and MDX under `docs/`, `blog/`, and `src/pages/`. Read this file before every task.

## Layout

- `astro.config.mjs`: site settings (title, address, navbar, footer, plugins). It is JavaScript, so no schema checks it; change it only when the task asks.
- `docs/`: the documentation. Each Markdown or MDX file is a page at `/docs/<path>`; `docs/<folder>/_category_.json` sets a folder's label and position in the sidebar.
- `blog/`: the posts, named `YYYY-MM-DD-<slug>.md`. `blog/authors.yml` lists the authors a post names in `authors`.
- `src/pages/`: standalone pages. `src/pages/<name>.md` is served at `/<name>`.
- `dist/`: the built site. Astro writes it on every build; never edit it.
- `content-schemas.json`: which JSON Schema checks which file. The schemas are in `schema/`.

## Add a page

Create `docs/<section>/<slug>.md`, served at `/docs/<section>/<slug>`:

```markdown
---
title: Install
description: How to install it, in one sentence.
sidebar_position: 2
---

Plain Markdown here.
```

Use only the front matter keys in `schema/doc.schema.json` (docs), `schema/blog-post.schema.json` (posts), or `schema/page.schema.json` (pages). Link to another page by its relative file path, ending in `.md`, so Astro checks the link.

## Check your edit

```sh
npx astro build
npx slipway doctor . --build dist
```

The build fails on a broken link. The second command checks the site against the agent-editable spec. Fix every error before you finish.

## Never

- Never edit `dist/`; your change is lost on the next build.
- Never change a page's `id` or `slug`, or move its file, without a redirect: other sites link to its address.
- Never remove `slipway` from `integrations` in `astro.config.mjs`: it writes `dist/sourcemap.json`, the Markdown copy of each page, and the source line on each heading that agents read.
