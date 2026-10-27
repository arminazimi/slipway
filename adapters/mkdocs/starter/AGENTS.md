# AGENTS.md

How to edit this site. It is a MkDocs site; you edit Markdown under `docs/` and the settings in `mkdocs.yml`. Read this file before every task.

## Layout

- `mkdocs.yml`: site settings (title, theme, plugins).
- `docs/`: the pages. `docs/index.md` is the home page.
- `site/`: the built site. MkDocs writes it on every build; never edit it.
- `content-schemas.json`: which JSON Schema checks which file. The schemas are in `schema/`.

## Add a page

Create `docs/<section>/<slug>.md`, served at `/<section>/<slug>/`:

```markdown
---
title: About us
---

Plain Markdown here.
```

Use only the front matter keys in `schema/front-matter.schema.json`.

## Check your edit

```sh
mkdocs build
npx slipway doctor . --build site
```

The second command checks the site against the agent-editable spec. Fix every error before you finish.

## Never

- Never edit `site/`; your change is lost on the next build.
- Never remove `slipway` from `plugins` in `mkdocs.yml`.
