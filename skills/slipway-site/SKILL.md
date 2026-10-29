---
name: slipway-site
description: Create a new GitHub Pages site with the Slipway Jekyll theme, or customize an existing one through _config.yml, navigation, languages, tokens, and override slots.
---

# Create and customize a Slipway site
Slipway is a Jekyll theme for GitHub Pages, right-to-left ready. You customize a site through config and three override slots, never by copying or editing theme files. Every key you may set is listed in [reference/config.md](reference/config.md); do not add keys it does not list under `slipway`.

## 1. Create the site

Use `remote_theme`. It works on GitHub Pages with no build step. In an empty repository (or a folder of an existing one that Pages serves), create `_config.yml`:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/arminazimi/slipway/main/schema/slipway-config.schema.json
title: My site
lang: en
remote_theme: arminazimi/slipway
plugins:
  - jekyll-remote-theme
```

Then create `index.md`, the home page:

```markdown
---
title: My site
description: What this site is, in one sentence.
layout: default
---

Plain Markdown here.
```

Copy the theme's starter files into the site root, keeping their paths: `starter-files/AGENTS.md` (how an agent edits the site) and `starter-files/.vscode/settings.json` (schema autocomplete). Fetch them from https://github.com/arminazimi/slipway/tree/main/starter-files.

Those two files are a working site. Add a page below for each feature the site needs; the theme fills it in. Each is front matter only; keep it even though it has no text:

| File | Turns on | Front matter |
| --- | --- | --- |
| `search.json` | Search in the header | `layout: search-index`, `lang: en`, `permalink: /search.json` |
| `feed.xml` | The Atom feed | `layout: feed`, `lang: en`, `permalink: /feed.xml` |
| `sitemap.xml` | The sitemap | `layout: sitemap`, `permalink: /sitemap.xml` |
| `llms.txt`, `llms-full.txt` | A page list for agents ([llmstxt.org](https://llmstxt.org)) and every page's text in one file | `layout: llms`, `permalink: /llms.txt`; `layout: llms-full`, `permalink: /llms-full.txt` |
| `404.md` | A styled not-found page | `title: Page not found`, `layout: not-found`, `permalink: /404.html`, `sitemap: false`, `search: false` |

Add `tags.md` (`layout: tags`, `permalink: /tags/`) and `archive.md` (`layout: archive`, `permalink: /archive/`) when the site has posts. `examples/minimal` in the theme repository has every one of these files. For post authors, add `_data/authors.yml` (each key is an id with a `name`, and optionally `bio`, `avatar`, and `links`) and one page per author with `layout: author` and `author: <id>`; `examples/blog` has both.

To publish, the owner turns on GitHub Pages for the repository (Settings, Pages, deploy from a branch). That is a repository setting: ask the owner, do not change it yourself. Leave `url` and `baseurl` unset on GitHub Pages; Pages fills them in. Set `baseurl` (such as `/my-project`, no trailing slash) only to preview a project site locally.

## 2. Set the title and languages

- `title`: the site name in the header, the page title, and the feed.
- `lang`: the default language, a BCP 47 tag such as `en` or `fa`. Right-to-left languages (`fa`, `ar`, `he`, `ur`) get a right-to-left layout on their own; set `direction` only to override it.

For more than one language, list them in switcher order. The default language has the prefix `""`:

```yaml
slipway:
  languages:
    - { code: en, name: English, prefix: "" }
    - { code: fa, name: فارسی, prefix: /fa }
```

Each other language needs a home page at `<prefix>/index.md` with `lang: fa`, `permalink: /fa/`, and the same `translation_key` as `index.md` (such as `home`). Give it its own `<prefix>/search.json` and `<prefix>/feed.xml` with `lang` and `permalink` under the prefix. `examples/minimal/fa/` shows all three.

A Persian site can opt in to Persian digits and the Jalali calendar:

```yaml
slipway:
  persian:
    digits: true
    jalali: true
```

The theme ships interface strings for English and Persian. For another language, add `_data/i18n/<lang>.yml`; copy the keys from `examples/minimal/_data/i18n/de.yml`.

## 3. Set the navigation

Create `_data/navigation.yml`. `main` is the header menu; `docs` is the sidebar of the `doc` layout, in reading order, with one level of `children`. `url` is the page's address, not its file. A language other than the default gets its own list, such as `main_fa`.

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/arminazimi/slipway/main/schema/navigation.schema.json
main:
  - title: Home
    url: /
  - title: About
    url: /about.html
main_fa:
  - title: خانه
    url: /fa/
docs:
  - title: Start
    children:
      - title: Introduction
        url: /docs/
```

## 4. Change the look with tokens

Restyle through `slipway.tokens`, not CSS:

```yaml
slipway:
  tokens:
    accent: "#0b6e4f"
    radius: 0.5rem
```

Colors are `#rrggbb` or `oklch()`. A color you set applies to both light and dark, so check it reads in both. The keys and their defaults are in [reference/config.md](reference/config.md); what each token does is in https://github.com/arminazimi/slipway/blob/main/docs/tokens.md. Pick a header layout with `slipway.header`: `classic` (the default), `centered`, or `minimal` (title, language switcher, and theme toggle only, no navigation or search).

## 5. Add to the theme with override slots

Three files are the supported way to add markup or CSS. Create them in the site; they replace the theme's empty ones:

| Slot | Renders | Use it for |
| --- | --- | --- |
| `_includes/head-custom.html` | End of `<head>`, every page | Meta tags, analytics, a font link |
| `_includes/footer-custom.html` | Inside `<footer>`, every page | An extra line or link |
| `assets/css/custom.css` | After the theme styles and tokens | Overriding `--sl-*` variables, styling your own content |

In these files, add `defer` to scripts (every page must read without JavaScript), and use logical CSS properties (`margin-inline-start`, not `margin-left`) so right-to-left works. Do not copy or shadow any other theme include or layout: only these three are stable across releases. `examples/docs` fills all three; details are in https://github.com/arminazimi/slipway/blob/main/docs/overrides.md.

## 6. Check the site

Run `slipway doctor` on the site. It is not on npm yet: run it from a clone of https://github.com/arminazimi/slipway after `npm ci`, with the site folder as the argument, and add `--build` with the built folder when you have one:

```sh
node packages/doctor/bin/slipway.mjs doctor ../my-site --build ../my-site/_site
```

It prints the conformance level the site reaches and each finding as `path:line key: message`. It also warns about starter files the site has not copied, Liquid in content, and translations with a missing language. Fix each finding at the file and line it names and run it again until it is clean.

To build the site locally, give it a `Gemfile` with `gem "github-pages", group: :jekyll_plugins`, then run:

```sh
bundle exec jekyll build
```

Read every error and warning and fix them the same way. To look at the result, run `bundle exec jekyll serve` and open the address it prints. Without a `Gemfile`, push and read the log of the Pages build.

## 7. Dependencies
Check a gem, npm package, or Action with Evergreen's `check_dependency` before adding it, when Evergreen is available. Evergreen stays optional.
## Never
- Never edit files under `_site/`; the build replaces them.
- Never copy theme layouts or includes; use tokens and the three slots.
- Never put Liquid (`{{ }}` or `{% %}`) in page content.
- Never add a key under `slipway` that [reference/config.md](reference/config.md) does not list; the schema rejects it.
- Never turn on Pages, add secrets, or change repository settings; ask the owner.
