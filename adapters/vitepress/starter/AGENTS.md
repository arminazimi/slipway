# AGENTS.md

How to edit this site. It is a VitePress site; you edit Markdown files in this folder and under `guide/`. Read this file before every task.

## Layout

- `.vitepress/config.mts`: site settings (title, navigation, sidebar, Markdown options). It is TypeScript, so no schema checks it; change it only when the task asks.
- `index.md`: the home page, served at `/`.
- `guide/`: the documentation, one Markdown file per page; `guide/<slug>.md` is served at `/guide/<slug>.html`.
- `.vitepress/dist/`: the built site. VitePress writes it on every build; never edit it.
- `content-schemas.json`: which JSON Schema checks which file. The schemas are in `schema/`.

## Add a page

Create `guide/<slug>.md`, served at `/guide/<slug>.html`:

```markdown
---
title: Install
description: How to install it, in one sentence.
---

Plain Markdown here.
```

Use only the front matter keys in `schema/front-matter.schema.json`.

## Check your edit

```sh
npx vitepress build .
npx slipway doctor . --build .vitepress/dist
```

The second command checks the site against the agent-editable spec. Fix every error before you finish.

## Never

- Never edit `.vitepress/dist/`; your change is lost on the next build.
- Never remove `sourcePlugin` from the markdown `config` option or `slipway` from `buildEnd` in `.vitepress/config.mts`: they write `.vitepress/dist/sourcemap.json`, the Markdown copy of each page, and the source line on each heading that agents read.
