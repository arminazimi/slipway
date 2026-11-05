# AGENTS.md

How to edit this site. It is a Hexo site; you edit Markdown under `source/`. Read this file before every task.

## Layout

- `_config.yml`: site settings (title, address, permalink, theme). `schema/hexo-config.schema.json` describes the keys an edit touches; change it only when the task asks.
- `source/_posts/`: the posts. Each file is a page at the address its `date` and name give through `permalink`, such as `/2026/01/02/hello/`.
- `source/`: the pages. `source/<section>/index.md` is served at `/<section>/`; any other Markdown file under `source/` becomes a page too.
- `scripts/slipway.js`: the Slipway plugin. It writes `public/sourcemap.json`, the Markdown copy of each page, and the source line on each heading that agents read.
- `themes/`: the site's theme. Leave it alone unless the task is about how the site looks.
- `public/`: the built site. Hexo writes it on every build; never edit it.
- `content-schemas.json`: which JSON Schema checks which file. The schemas are in `schema/`.

## Add a page

Create `source/<section>/index.md`, served at `/<section>/`:

```markdown
---
title: Install
description: How to install it, in one sentence.
---

Plain Markdown here.
```

A post goes in `source/_posts/` and needs a `title` and a `date` (`YYYY-MM-DD HH:mm:ss`). Use only the front matter keys in `schema/front-matter.schema.json`; add a key to the schema when the site needs a new one.

## Check your edit

```sh
npx hexo generate
npx slipway doctor . --build public
```

The second command checks the site against the agent-editable spec. Fix every error before you finish.

## Never

- Never edit `public/`; your change is lost on the next build.
- Never change a page's address, or move its file, without a redirect: other sites link to it.
- Never remove `scripts/slipway.js` or the filters it registers: they write `public/sourcemap.json`, the Markdown twin of each page, and the source line on each heading.
