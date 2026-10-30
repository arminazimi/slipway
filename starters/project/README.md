# Project starter

A homepage for an open-source library or tool: what it does, how to install it, a short API reference, how to contribute, and where to ask for help. Copy the folder into a repository, set `title`, `description`, and the `social` links in `_config.yml`, and replace the sample content about Harbor.

Everything here builds with the GitHub Pages gem and works on classic Pages: the pages are Markdown, the sidebar comes from `_data/navigation.yml`, and the search index, sitemap, and `llms.txt` files are the theme's stubs.

## What is here

| File | What it is |
| --- | --- |
| `index.md` | The landing page (`layout: home`, `variant: landing`): install command, three features, and a call to action. |
| `docs/index.md` | The docs overview: what the project does and does not do. |
| `docs/install.md` | Install and a check that it works. |
| `docs/quick-start.md` | The shortest working example. |
| `docs/api.md` | The API reference: one section per export, with an options table. |
| `contributing.md` | How to report a bug and propose a change. |
| `support.md` | Where to ask a question and what to include. |
| `_data/navigation.yml` | The header (`main`) and the docs sidebar (`docs`). |
| `AGENTS.md` | What an agent reads before it edits the site. |
| `_config.remote.yml` | The overlay that switches the theme to `remote_theme`. |

## Use it

1. Copy the folder into your repository.
2. Change `title`, `description`, and `slipway.social` in `_config.yml`.
3. Replace the sample pages, then run `bundle exec jekyll build` and `npx slipway doctor . --build _site --level L2`.
