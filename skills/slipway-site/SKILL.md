---
name: slipway-site
description: Create a Slipway docs site, or customize an existing one through slipway.yml, navigation, languages, redirects, and theme options, then check it with slipway check.
metadata:
  version: "0.3.0"
---

# Create and customize a Slipway site

Slipway is a docs engine and a theme: the engine reads a folder of Markdown and writes a site, and the theme renders it, right-to-left ready. You customize a site through `slipway.yml`, `_data/navigation.yml`, and the theme's options, never by copying or editing engine or theme files. Every key you may set in `slipway.yml` is listed in [reference/config.md](reference/config.md). The file is closed: an unknown key is an error that names its line, so do not add keys the reference does not list.

## 1. Create the site

A site is a folder with a `slipway.yml` at its root. Every path in the file is relative to that folder.

```yaml
# slipway.yml
title: My site
description: What this site is, in one sentence.
url: https://example.github.io
lang: en
```

Then create the home page, `index.md`:

```markdown
---
title: My site
description: What this site is, in one sentence.
---

Plain Markdown here.
```

A file with no front matter still builds: its title is its first heading and its URL comes from its path. Every other key is optional.

Set `url` to the scheme and host of the published site, with no path and no trailing slash. Without it, canonical links, the sitemap, and social images are relative or left out, and the engine warns. A project site lives under a path: set `base` to that path (such as `/my-site`, with a leading slash and no trailing slash). Leave `base` empty at a domain root.

```yaml
# slipway.yml
url: https://example.github.io
base: /my-site
```

## 2. Set the title and languages

- `title`: the site name in the header, the page titles, and `llms.txt`. Without it, the folder name is used.
- `lang`: the default language, a BCP 47 tag such as `en` or `fa`. Text direction follows the language: `fa`, `ar`, `he`, and `ur` are right to left. Set `dir` only to override it.

For more than one language, list them in switcher order. The default language has an empty prefix:

```yaml
# slipway.yml
languages:
  - { code: en, name: English, prefix: "" }
  - { code: fa, name: فارسی, prefix: /fa }
```

Pages in the second language live under its prefix folder (`fa/index.md`, `fa/install.md`), and each sets or inherits its `lang`. Their URLs come from their paths: `fa/install.md` is `/fa/install/`. Translation is described in [the content Skill](../slipway-content/SKILL.md).

## 3. Set the navigation

Navigation lives in `_data/navigation.yml`. The file is a set of top-level lists, such as `main` for the header and `docs` for the sidebar. Each item is a link or a group with `children`. A link `url` is a path on the site, written without `base`; the engine adds it.

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/arminazimi/slipway/main/schema/navigation.schema.json
main:
  - title: Home
    url: /
  - title: About
    url: /about/
docs:
  - title: Start
    children:
      - title: Introduction
        url: /docs/
```

`navigation` in `slipway.yml` names another file. Without the file, navigation is built from the folders and each page's `order`.

## 4. Set the defaults and the repository

`defaults` gives front matter to every page under a folder unless the page sets the key itself. A later entry wins over an earlier one; a page always wins.

```yaml
# slipway.yml
defaults:
  - path: fa
    values:
      lang: fa
```

`repository` lets pages link to their source and lets agents find it:

```yaml
# slipway.yml
repository:
  url: https://github.com/example/my-site
  branch: main
  dir: ""
```

`dir` is the site root's folder inside the repository, such as `docs`; leave it empty when the site is the repository.

## 5. Set the theme options

`theme.name` names the theme; the engine's theme is the default. `theme.options` is handed to the theme unread. Its keys belong to the theme, which validates them against its own schema and reports an unknown key with its line. This reference does not list them: do not guess a key. Read the theme's documentation or ask the owner.

## 6. Set search, redirects, and outputs

- `search: false` builds no search index. As an object, `search.text` sets how many characters of each page's body the index keeps (default `300`). Pages leave the index with `search: false` in their front matter.
- `redirects` maps an old path under `base` to a path on the site or an `https` URL. A redirect over a page that exists, or two redirects from the same old path, is an error.
- `outputs` turns an output off by its name, the file name of the output in `packages/engine/src/outputs/`, with `false`. An unknown name is an error.

```yaml
# slipway.yml
search:
  text: 500
redirects:
  /old-install/: /docs/install/
```

## 7. Check the site

From the site folder:

```sh
slipway check .
```

It prints each finding with its file and line. Fix each one at the line it names and run the check again until it is clean.

Build the site to a folder:

```sh
slipway build . --out dist
```

`slipway` is the engine's command line, released with the engine (`engine.cli`). Until it is installed, no check can run: say so in your report and do not invent a result.

Turning on GitHub Pages, adding secrets, or changing repository settings is the owner's decision. Ask the owner; do not do it yourself.

## Never

- Never add a key under the top level of `slipway.yml` that [reference/config.md](reference/config.md) does not list; the file is closed.
- Never invent a `theme.options` key; the theme reports it, but guessing wastes a build.
- Never edit the output folder (`dist/`, or the folder passed to `--out`); the build replaces it.
- Never copy engine or theme files into the site to change them; use `slipway.yml`, `_data/navigation.yml`, and `theme.options`.
- Never turn on Pages, add secrets, or change repository settings; ask the owner.
