---
name: slipway-translate
description: Add a language to a Slipway site, translate pages and posts, and keep every translation linked through lang, translation_key, the language switcher, and hreflang.
metadata:
  version: "0.2.0"
---

# Translate a Slipway site

A Slipway site joins translations with two front matter keys: `lang` says which language a page is in, and `translation_key` is the same on every translation of one page. The theme builds the language switcher, the `hreflang` alternates, and the sitemap entries from those keys. You translate the words and set the language; you never build the links yourself. If the site has an `AGENTS.md`, read it first; it wins where it differs from this skill.

## 1. Take a baseline

Get the theme's checks once, in a folder outside the site:

```sh
git clone --depth 1 https://github.com/arminazimi/slipway "$HOME/.slipway"
cd "$HOME/.slipway" && npm ci && cd -
```

From the site folder, run the schema check and the doctor before you change anything, and keep the output:

```sh
node "$HOME/.slipway/tools/theme/validate.mjs" .
node "$HOME/.slipway/packages/doctor/bin/slipway.mjs" doctor . --build _site
```

Your edit is done when it adds no problem and no finding to that output, apart from the translation-coverage warnings that step 5 explains.

## 2. List the language in the config

`slipway.languages` in the site's `_config.yml` lists every language, in switcher order. Each entry needs a `code` (the `lang` value, such as `de` or `pt-BR`), a `name` in that language, and a `prefix` (the URL folder, or `""` for the default language):

```yaml
slipway:
  languages:
    - { code: en, name: English, prefix: "" }
    - { code: de, name: Deutsch, prefix: /de }
```

Each language needs a home page under its prefix (such as `de/index.md`, with `lang: de`, `permalink: /de/`, and the same `translation_key` as the default home), plus, when the site has them in its other languages, its own `search.json` and `feed.xml` with `lang` and a `permalink` under the prefix; `examples/minimal/fa/` has both, and `examples/minimal/_data/navigation.yml` shows the per-language `main_fa` menu. Without the home page the switcher points at a missing page; without the stubs the language has no search index and no feed link.

Text direction follows `lang`: the codes listed in `_includes/dir.html` render right to left, so never set `direction` or `dir` for them. A right-to-left language that is not in that list needs `direction: rtl` in the front matter of its pages, or in `_config.yml` when the whole site is that language.

## 3. Add the interface strings

The theme's own labels (Search, Next, Language, and the rest) come from English until the language supplies them. A site adds one file, `_data/i18n/<code>.yml`, with a key for every key in `_includes/i18n/en.html`, in the same alphabetical order; a key it leaves out falls back to English. `examples/minimal/_data/i18n/de.yml` is a short example, and the doctor warns when one configured language has a key another lacks.

```yaml
# _data/i18n/de.yml
search: Suche
series: Serie
```

Quote `yes` and `no` (Ruby reads them as booleans), and keep the placeholders in `search_count`, `series_part`, and `edit_prompt` (`{n}`, `{total}`, `{source}`, `{text}`). Never invent a key; a key the theme does not use is dead text.

A site language stops here: `_includes/t.html` reads `_data/i18n/` before the built-in strings. To make a language built in for every site instead, add `_includes/i18n/<code>.html` with one `case` branch per key, in the same order as `_includes/i18n/en.html`, and add the code to the `sl_supported` list in `_includes/i18n-builtin.html`; every code in that list needs its file, or the include fails. A right-to-left language also goes in `_includes/dir.html`. `tools/theme/i18n.test.mjs` compares a built-in language's keys with English; add its code to that test's list.

## 4. Translate a page or post

1. On the original, set `lang` (even for the default language: the switcher matches on it) and a `translation_key` such as `about`. The switcher cannot pair a page that lacks either.
2. Create the translation from the site folder:

   ```sh
   node "$HOME/.slipway/packages/doctor/bin/slipway.mjs" translate about.md --to de
   ```

   It writes the copy under `de/` with the front matter kept and `lang: de`, and it stops when the source has no `translation_key`. For a post, copy the file by hand into `_posts/` with the language in the slug, `_posts/<date>-<slug>-<code>.md`: Jekyll reads posts only from `_posts/` at the site root.
3. Front matter: keep `translation_key` exactly as the original; translate `title`, `description`, and `tags`; keep `layout`, `date`, and `author`. When the original sets a `permalink`, change it to the address under the prefix, because the copy keeps the original's and the two would collide; otherwise the file's place under the prefix sets the address:

   ```yaml
   title: Über Slipway
   description: Die deutsche Fassung der Über-Seite.
   layout: page
   lang: de
   permalink: /de/about.html
   translation_key: about
   ```

4. Body: translate the prose. Keep code, commands, file names, and URLs as they are. A link to a page that already has a translation points at the translated address (`/de/docs/`); every other link keeps the default-language address.
5. Add the page to `main_de` or `docs_de` in `_data/navigation.yml` when the language has those lists.

## 5. Keep the translations linked

- The switcher in `_includes/lang-switcher.html` finds a translation by `translation_key` and `lang`; when there is no match it links the language home from `prefix`. Both keys are what make it work, so a translation with a missing or different key falls back to the home page.
- `_includes/seo.html` writes an alternate `hreflang` link for every page that shares the key, plus `x-default` for the page in the site's default language. Two pages with the same key and the same `lang` are a duplicate; a page without `lang` is treated as the default language.
- The sitemap links translations too. A `translation-status` page (`examples/minimal/status.md`) lists every key and the languages that have it; link one from navigation to see the gaps.
- The doctor's `jekyll.translation-pair` warning names a key and a missing language. It is coverage, not an error: work through it for the pages in scope, and never silence it by removing a key.

## 6. Check the edit

```sh
node "$HOME/.slipway/tools/theme/validate.mjs" .
bundle exec jekyll build
node "$HOME/.slipway/packages/doctor/bin/slipway.mjs" doctor . --build _site
```

Open the built home page and the translated page: the switcher should link the two, the translated page should carry `dir="rtl"` only for a right-to-left language, and its source should have one alternate `hreflang` link per translation. Compare the doctor's output with the baseline; a finding that names your file is yours to fix. Without a `Gemfile`, skip the build, run the doctor without `--build`, and read the Pages build log after you push.

## Never

- Never change `translation_key` on one translation only; change every page that shares it, or none.
- Never leave `lang` off a page that has a translation; the default language needs it too.
- Never add a language without its home page, or without the per-language `search.json` and `feed.xml` its other languages have.
- Never set `direction` or `dir` for a language that `_includes/dir.html` already marks right to left.
- Never add a UI key that `_includes/i18n/en.html` does not have, and never drop a placeholder from its text.
- Never put Liquid in a page, and never edit `_site/`.
