# AGENTS.md

How to edit this site. It is an Astro Starlight site; you edit Markdown and MDX files under `src/content/docs/`. Read this file before every task.

## Layout

- `astro.config.mjs`: site settings (address, title, sidebar, integrations) and the Starlight integration.
- `src/content.config.ts`: the `docs` content collection and its front matter schema.
- `src/content/docs/`: the pages. `src/content/docs/index.md` is the home page; `src/content/docs/<sections>/index.md` introduces a section; every other Markdown or MDX file is a page at `/<sections>/<slug>/`.
- `dist/`: the built site. Astro writes it on every build; never edit it.
- `content-schemas.json`: which JSON Schema checks which file. The schema is in `schema/`.

## Add a page

Create `src/content/docs/<section>/<slug>.md`, served at `/<section>/<slug>/`:

```markdown
---
title: About us
description: Who we are, in one sentence.
sidebar:
  order: 2
---

Plain Markdown here.
```

Use only the front matter keys in `schema/front-matter.schema.json`; Starlight rejects a key it does not know. The `title` becomes the page's heading, so start the body at `##`.

## Check your edit

```sh
npx astro build
npx slipway doctor . --build dist
```

The second command checks the site against the agent-editable spec. Fix every error before you finish.

## Never

- Never edit `dist/`; your change is lost on the next build.
- Never rename a page's file without updating the links to it: the URL comes from the file path.
- Never remove `remarkSource` from the Markdown processor in `astro.config.mjs` or `slipway` from its integrations: they write `dist/sourcemap.json`, the `data-source` line each heading needs, and the Markdown copy of each page that agents read.
