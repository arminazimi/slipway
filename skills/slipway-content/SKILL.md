---
name: slipway-content
description: Write or edit a page, doc page, or post on a Slipway site, or translate one into another language, so it passes the front matter schemas and slipway doctor.
metadata:
  version: "0.2.0"
---

# Write pages and posts on a Slipway site

A Slipway site is Markdown files with a block of front matter. The layouts do the rest: the title, the heading, the table of contents, the date, and the language switcher. You write the front matter from the schema and the words in plain Markdown. If the site has an `AGENTS.md`, read it first; it wins where it differs from this skill.

## 1. Take a baseline

Get the theme's checks once, into a folder outside the site:

```sh
git clone --depth 1 https://github.com/arminazimi/slipway "$HOME/.slipway"
cd "$HOME/.slipway" && npm ci && cd -
```

Run section 6 before you change anything and keep the output. Your edit is done when it adds no problem and no finding to it.

## 2. Pick the layout and the file

| You are writing | `layout` | File |
| --- | --- | --- |
| A plain page (about, contact) | `page` | `<folder>/<page>.md`, served at `/<folder>/<page>.html` |
| A documentation page with the sidebar | `doc` | any folder, often `docs/<page>.md`, with a `permalink` |
| A dated post | `post` | `_posts/<date>-<slug>.md`, where `<date>` is `YYYY-MM-DD` |
| The landing page | `home` | `index.md` |

A post's file name is its date and its address; to change the title, set `title`, never rename the file. A `doc` page shows in the sidebar only when the `docs` list in `_data/navigation.yml` links its `permalink`; add it there in reading order. Do not create `search.json`, `feed.xml`, `sitemap.xml`, `404.md`, `tags.md`, or `archive.md`: they exist already, and they have front matter and no text on purpose.

Drafts, scheduled posts, and edits, on a post: a draft goes in `_drafts/<slug>.md`, with no date in its name — GitHub Pages never builds `_drafts/`, and `jekyll serve --drafts` previews it with today's date. A scheduled post is a normal post whose `YYYY-MM-DD` file name is in the future: GitHub Pages publishes it automatically on that date, and `jekyll serve --future` previews it early, marked Scheduled on the page. After a substantial edit to a published post, add `updated: YYYY-MM-DD` (the same form as the file name's date): the post shows it as "edited on", and the feed, the sitemap, and the structured data report it as the last-modified date.

## 3. Fill the front matter from the schema

Every key, its type, and its allowed values are in [reference/front-matter.md](reference/front-matter.md), generated from the schemas the checks use. Use only keys it lists for your layout.

- `title` is required and must not be empty. The layout prints it as the page heading.
- Add `description`: one sentence for search results and link previews.
- `tags` and `categories` are a list: `tags: [release, notes]`.
- `author` on a post is a key of `_data/authors.yml`, or a list of keys for several authors: `author: [ada, sam]`. If the key is missing from that file, add the author there first.
- `series` on a post puts it in a series: use the exact same name on every part, `series: Writing for the web`. The parts are ordered by date.
- `permalink` starts with `/`. Leave it out on a post in the default language; the site's config sets the address.
- Set `lang` on a page that is not in the site's default language (`lang` in `_config.yml`), and on every page that has a translation.
- `home` only: `cta_text` and `cta_url` go together, or not at all. `variant` picks the look: `editorial` (default), `landing` (add `features`, each with a `title`), `blog`, or `docs` (cards from the `docs` list of `_data/navigation.yml`).
- Quote a value that contains `: ` or starts with a character YAML treats specially (`[`, `{`, `*`, `&`, `!`, `#`, `|`, `>`, `@`, or a backtick).

## 4. Write the body

- Plain Markdown only. Never Liquid: no `{{ }}` and no `{% %}`, not even in a code block. The layouts already add what Liquid would.
- Start sections at `##`. The `h1` is the title; one `#` heading in the body makes a second one.
- Keep heading levels in order (`##`, then `###`), so the table of contents and the "Edit with your agent" button find every section.
- Link to other pages by address, not file: `[Install](/docs/install/)`, `[About](/about.html)`.
- Images live in `assets/`; give each one alt text: `![A chart of build times](/assets/build-times.png)`.
- For a wider page, set `width: narrow`, `wide`, or `full` in the front matter. To widen one block instead (a table, an image, a figure), wrap it in an HTML element with the class `sl-wide` (up to 64rem) or `sl-bleed` (edge to edge): `<figure class="sl-wide"><img src="/assets/map.png" alt="A map of the route"></figure>`. The `doc` layout keeps sections in its column.
- Give code blocks a language (` ```yaml `), so they highlight and read left to right in a right-to-left page.

Examples that pass the schemas:

- [examples/doc-page.md](examples/doc-page.md): a `doc` page.
- [examples/post.md](examples/post.md): a post with tags.
- [examples/post-fa.md](examples/post-fa.md): the same post in Persian.

The first comment in each says where the file goes.

## 5. Add a translation

1. The language must be in `slipway.languages` in `_config.yml`, with a `code`, a `name`, and a `prefix` such as `/fa`. If it is missing, ask before you add a language: it changes every page's switcher.
2. Give the original a `translation_key` if it has none, such as `plain-markdown`, and its `lang` (`lang: en`) if it has none: the switcher finds a translation by both. Give the translation the same `translation_key`. That links the two in the language switcher and the sitemap.
3. Set `lang` to the language code, and `permalink` to an address under the prefix: `/fa/plain-markdown/`.
4. Where the file goes: a page goes in the prefix folder (`fa/about.md`); a post stays in `_posts/` with its own slug (`_posts/2026-10-20-plain-markdown-fa.md`).
5. Translate `title`, `description`, `tags`, and the body. Keep `layout`, the date, code, commands, and URLs as they are.
6. If the site has a header menu for that language (`main_fa` in `_data/navigation.yml`), add the page there too.

Right-to-left languages (`fa`, `ar`, `he`, `ur`) get a right-to-left layout from `lang`; do not set `direction` or `dir`. In Persian text, use Persian `ی` and `ک` (not the Arabic `ي` and `ك`), a zero-width non-joiner in words such as `می‌شود`, and Persian punctuation (`،` and `؟`). Put commands, file names, and code in backticks: they stay left to right inside the sentence.

## 6. Check the edit

From the site folder, check the config and the front matter of every page against the schemas:

```sh
node "$HOME/.slipway/tools/theme/validate.mjs" .
```

Each problem is printed as `file:line key: message (allowed: ...)`. Fix it at that line, using the allowed values, and run it again. Then build the site, if it has a `Gemfile`:

```sh
bundle exec jekyll build
```

Read every error and warning and fix it at the file it names. Then run the doctor on the source and the build. It checks the site against the agent-editable spec: `AGENTS.md`, `content-schemas.json` (when the site has one, it validates your front matter against the schemas it names), the source map, and the edit prompts:

```sh
node "$HOME/.slipway/packages/doctor/bin/slipway.mjs" doctor . --build _site
```

Compare its findings with your baseline. A finding that names your file is yours to fix. Without a `Gemfile`, run the doctor without `--build` and read the log of the Pages build after you push.

## Never

- Never put Liquid (`{{ }}` or `{% %}`) in a page.
- Never add a front matter key that [reference/front-matter.md](reference/front-matter.md) does not list.
- Never change `translation_key` on one translation only; change every page that shares it, or none.
- Never rename or move a published page or post to change its title; set `title`. Its address is its file name or `permalink`, and links to it would break.
- Never edit `_site/`, and never delete a page that has front matter and no text.
- Never edit theme layouts or includes to change how one page looks.
