# AGENTS.md

How to edit this site. It is a Quarto website; you edit the `.qmd` files that `_quarto.yml` renders and the settings in `_quarto.yml`. Read this file before every task.

## Layout

- `_quarto.yml`: site settings (title, description, the render list, and the Slipway extension).
- `index.qmd`: the home page.
- `docs/`: the other pages. Each `.qmd` file is a page at its own path.
- `_site/`: the built site. Quarto writes it on every build; never edit it.
- `content-schemas.json`: which JSON Schema checks which file. The schemas are in `schema/`.
- `_extensions/slipway/`: the Slipway extension. It adds `data-source` to headings and writes `_site/sourcemap.json` and the Markdown copy of each page.

## Add a page

Create `docs/<slug>.qmd`, served at `/docs/<slug>.html`:

```markdown
---
title: About us
description: Who we are, in one sentence.
---

Plain Markdown here.
```

Use only the front matter keys in `schema/front-matter.schema.json`. Link to another page by its relative file path, ending in `.qmd`, so the source map can list it.

## Check your edit

```sh
quarto render
npx slipway doctor . --build _site
```

The second command checks the site against the agent-editable spec. Fix every error before you finish.

## Never

- Never edit `_site/`; your change is lost on the next build.
- Never move a page's file without updating the links to it: its address changes.
- Never remove `slipway` from `filters` or the `post-render` line from `_quarto.yml`: they write `_site/sourcemap.json`, the Markdown copy of each page, and the source line on each heading that agents read.
