# Portfolio starter

A site for a designer, studio, or small agency: a home page that lists the newest case studies, a work archive, an about page, and a contact page. Copy the folder into a repository, set `title`, `description`, and `social` in `_config.yml`, and replace the sample studio with your own.

Everything here builds with the GitHub Pages gem and works on classic Pages: the pages are Markdown and the search index, sitemap, and `llms.txt` files are the theme's stubs.

## What is here

| File | What it is |
| --- | --- |
| `index.md` | The home page (`layout: home`, editorial variant) with an introduction and the three newest case studies. |
| `_posts/` | Three sample case studies, each with the same four headings: problem, what we did, what shipped, result. |
| `work.md` | The archive page (`layout: archive`) that lists every post by year. |
| `about.md` | Who you are, how you work, and what you charge. |
| `contact.md` | What to send, how soon you answer, and what you do not take on. |
| `_data/navigation.yml` | The header menu (`main`). |
| `AGENTS.md` | What an agent reads before it edits the site. |
| `_config.remote.yml` | The overlay that switches the theme to `remote_theme`. |

## Use it

1. Copy the folder into your repository.
2. Change `title`, `description`, and `slipway.social` in `_config.yml`.
3. Replace the sample pages and posts, then run `bundle exec jekyll build` and `npx slipway doctor . --build _site --level L2`.
