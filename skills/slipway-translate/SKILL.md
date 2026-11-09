---
name: slipway-translate
description: Add a language to a Slipway site, translate pages, and keep every translation linked through lang and translation_key, then check it with slipway check.
metadata:
  version: "0.3.0"
---

# Translate a Slipway site

A Slipway site joins translations with two front matter keys: `lang` says which language a page is in, and `translation_key` is the same on every translation of one page. The engine reads both and the theme uses `lang` for the interface strings and the text direction. You translate the words and set the language; you never build the links by hand. If the site has an `AGENTS.md`, read it first; it wins where it differs from this Skill.

## 1. Take a baseline

From the site folder, run the check before you change anything, and keep its output:

```sh
slipway check .
```

Your edit is done when it adds no finding that names your file. `slipway` is the engine's command line, released with the engine (`engine.cli`). Until it is installed, say so in your report and do not invent a result.

## 2. List the language in the config

`languages` in `slipway.yml` lists every language, in switcher order. Each entry needs a `code` (the `lang` value, such as `de` or `pt-BR`), a `name` in that language, and a `prefix` (the URL folder, or `""` for the default language):

```yaml
# slipway.yml
languages:
  - { code: en, name: English, prefix: "" }
  - { code: de, name: Deutsch, prefix: /de }
```

Pages in the second language live under its prefix folder: `de/index.md`, `de/install.md`. A page's `lang` comes from its front matter, then from the prefix of its folder, then from `lang` in `slipway.yml`. Its URL comes from its path, so `de/install.md` is `/de/install/`.

Each language needs a home page under its prefix (such as `de/index.md`, with `lang: de`, and the same `translation_key` as the default home). Without it the language has no landing page. Do not add a language without its home page, and do not add one only to translate a single page unless the owner asks: it changes the language list for the whole site.

## 3. Interface strings

The theme ships its labels (Search, Next, Language, and the rest) in English, Persian, and Arabic. A page in another language falls back to English; a site cannot add or override interface strings in 0.3. Do not create `_data/i18n/` or edit theme files to translate a label: report the missing label to the owner instead.

Text direction follows `lang`: `fa`, `ar`, `he`, and `ur` are right to left, and the engine knows the other right-to-left languages. Never set `dir` for a language the engine already marks right to left. Set `dir: rtl` in the front matter, or in `slipway.yml` when the whole site is that language, only for a right-to-left language the engine does not know.

## 4. Translate a page

1. On the original, set `lang` (even for the default language) and a `translation_key` such as `about`.
2. Create the translation under the language prefix, such as `de/about.md`, with the same `translation_key` and `lang: de`. It keeps the original's address only when the original sets `permalink`; then set a `permalink` under the prefix, such as `/de/about/`, or the two pages collide.
3. Front matter: keep `translation_key`, the `layout`, the `order`, and the `agent` value; translate `title` and `description`.
4. Body: translate the prose. Keep code, commands, file names, and URLs as they are.
5. A link to a page that already has a translation points at the translated address (`/de/docs/`); every other link keeps the default-language address.
6. Add the page to `main_de` or `docs_de` in `_data/navigation.yml` when the language has those lists.

A page without a `lang` key inherits its language from its folder prefix, then from the site language. A different `translation_key` still keeps the page out of its translation group.

## 5. Keep the translations linked

- `translation_key` and `lang` are the pair that links translations. Two pages with the same key and the same language are a duplicate; a page with a key but no other language is an untranslated page.
- Never change a key on one translation only. Change every page that shares it, or none. A key changed on one page separates it from its translations.
- The doctor's `translation-pair` warning names a key and a missing language in `languages`. It is coverage, not an error: work through it for the pages in scope, and never silence it by removing a key or a language.
- `sourcemap.json` and the Markdown twins in the build carry each page's own text, so a translation is read and checked as its own page.

## 6. Check the edit

Build the site, then compare the result with the baseline:

```sh
slipway check .
slipway build . --out dist
```

Open the built home page and the translated page: the translated page should carry `dir="rtl"` only for a right-to-left language, its `lang` should be the language code, and its links should point at the translated addresses where they exist. A finding that names your file is yours to fix.

## Never

- Never change `translation_key` on one translation only; change every page that shares it, or none.
- Never leave `lang` off a page that has a translation; the default language needs it too.
- Never add a language without its home page.
- Never set `dir` for a language the engine already marks right to left.
- Never add `_data/i18n/` or edit a theme file to translate an interface label.
- Never put template syntax in a page, and never edit the output folder (`dist/`).
