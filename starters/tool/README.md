# Tool starter

A site for a command-line tool or library: a landing page with the install command, a guide, a command reference, and a changelog. Copy the folder into a repository, set `title` and `description` in `_config.yml`, and replace the sample content about Orbit with your own tool.

Everything here builds with the GitHub Pages gem and works on classic Pages: the pages are Markdown, the sidebar comes from `_data/navigation.yml`, and `search.json`, `sitemap.xml`, `llms.txt`, and `llms-full.txt` are the theme's stubs.

## What is here

| File | What it is |
| --- | --- |
| `index.md` | The landing page (`layout: home`, `variant: landing`): the install command, three features, and a call to action. |
| `docs/index.md` | The guide's overview (`layout: doc`). |
| `docs/install.md` | Install and first-run setup. |
| `docs/commands.md` | The command reference: one table of flags and exit codes per command. |
| `changelog.md` | The release page (`layout: changelog`), newest release first. |
| `_data/navigation.yml` | The header (`main`) and the docs sidebar (`docs`). |
| `AGENTS.md` | What an agent reads before it edits the site. |
| `_config.remote.yml` | The overlay that switches the theme to `remote_theme`. |

## What is not here yet

The theme has no CLI reference layout, so `docs/commands.md` is a plain Markdown table rather than a generated reference. When that layout lands, the page's content becomes data and this section goes away.

## Use it

1. Copy the folder into your repository.
2. Change `title` and `description` in `_config.yml`.
3. Replace the sample pages, then run `bundle exec jekyll build` and `npx slipway doctor . --build _site --level L2`.
