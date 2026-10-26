# AGENTS.md

How to edit this site. It is an Eleventy site; you edit Markdown files under `src/`. Read this file before every task.

## Layout

- `eleventy.config.js`: site settings.
- `src/`: the content folder.
- `_site/`: the built site. Eleventy writes it on every build; never edit it.
- `content-schemas.json`: which JSON Schema checks which file. The schemas are in `schema/`.

## Add a page

Create `src/<slug>.md`, served at `/<slug>/`:

```markdown
---
title: About us
description: Who we are, in one sentence.
---

Plain Markdown here.
```

Use only the front matter keys in `schema/front-matter.schema.json`.

## Check your edit

```sh
npx @11ty/eleventy
npx slipway doctor . --build _site
```

The second command checks the site against the agent-editable spec. Fix every error before you finish.

## Never

- Never edit `_site/`; your change is lost on the next build.
- Never remove the `slipway-eleventy` plugin from `eleventy.config.js`: it writes `_site/sourcemap.json` and the Markdown copy of each page that agents read.
