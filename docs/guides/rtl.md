# Multilingual and Right-to-Left Sites

Slipway supports multilingual sites and right-to-left (RTL) text natively. This guide explains how to set up multiple languages, use RTL text, translate the interface, write RTL-safe custom CSS, handle mixed-direction content, and test your site.

## 1. Set up a multilingual site

To set up a multilingual site, configure the languages in your `_config.yml`. Under the `slipway.languages` key, list each language your site supports:

```yaml
slipway:
  languages:
    - { code: en, name: English, prefix: "" }
    - { code: fa, name: فارسی, prefix: "/fa" }
```

Organize your content by creating one folder per language that has a prefix (for example, `/fa/` for Persian).

In the front matter of every page and post, set the `lang` field to match its language:

```yaml
---
title: "My Page"
lang: en
---
```

To link translations of the same page together, use the `translation_key` field in the front matter. Give both the English page and the Persian page the same key:

```yaml
---
title: "صفحه من"
lang: fa
translation_key: my_page
---
```

The theme automatically adds a language switcher to the navigation bar. If a translation for the current page exists (matched by `translation_key`), the switcher links directly to it. If the translation is missing, it links to that language's home page instead.

## 2. Set up a right-to-left site

In Slipway, the text direction follows the `lang` automatically (as defined in [ADR 0010](../adr/0010-ui-strings-and-language-urls.md)). If a page has `lang: fa` (Persian), `ar` (Arabic), `he` (Hebrew), or another known RTL language, the theme sets its direction to right-to-left.

You can override the direction for a specific page or the whole site by setting the `direction` field to `rtl` or `ltr` in the front matter or `_config.yml`:

```yaml
---
title: "Special Page"
lang: en
direction: rtl
---
```

Here is a complete minimal example of a Persian configuration (`_config.yml`), taken from the `persian` example site:

```yaml
title: اسلیپ‌وی فارسی
lang: fa
theme: slipway-theme
plugins:
  - jekyll-remote-theme

slipway:
  persian:
    digits: true
    jalali: true
  languages:
    - { code: fa, name: فارسی, prefix: "" }
```

## 3. Translate the UI text

Slipway has built-in UI strings for English (`en`) and Persian (`fa`).

To add a new language, or to override the built-in text, create a YAML file in `_data/i18n/` named after the language code (for example, `_data/i18n/es.yml` for Spanish). Provide translations for the keys the theme uses, such as `search`, `main_nav`, or `next`:

```yaml
search: Buscar
main_nav: Menú
next: Siguiente
```

If a translation is missing in your YAML file, or if the language is unknown to the theme, the interface falls back to the built-in English strings.

## 4. Write RTL-safe custom CSS

When writing custom CSS for a multilingual site, use logical CSS properties instead of physical ones. Logical properties like `margin-inline-start` adapt automatically to the text direction, whereas `margin-left` is fixed to the left side and breaks RTL layouts.

For example, instead of this physical rule:

```css
/* Bad: Physical properties */
.card {
  margin-left: 1rem;
  padding-right: 0.5rem;
}
```

Write this logical rule:

```css
/* Good: Logical properties */
.card {
  margin-inline-start: 1rem;
  padding-inline-end: 0.5rem;
}
```

The theme enforces this convention. Run `npm run check:logical` to find any physical properties in your CSS files; the check will fail if they are present.

If you are styling components, review the available tokens in the [Theme Tokens](../tokens.md) guide rather than repeating colors or spacing manually.

## 5. Mixed-direction content

When writing RTL text, you may need to include English words, URLs, numbers, or code blocks. Mixed-direction content can sometimes display incorrectly if not isolated.

For now, you must add standard HTML attributes manually to keep mixed content readable in the built output:
- Wrap English words or URLs in Persian text with `<bdi>...</bdi>` (Bi-Directional Isolation) to prevent the browser from flipping punctuation.
- For code blocks that contain English code, apply `dir="ltr"` if your layout allows it, or wrap inline code in `<bdi>`.

**Known limits**: The theme does not yet automatically isolate titles, code, numbers, and URLs. This is tracked in issue [#226](https://github.com/arminazimi/slipway/issues/226).

## 6. Test a site in both directions

You can build and test an example site locally to verify its direction and language behavior.

Run this command to build the `persian` example site:

```bash
node tools/theme/build.mjs template out_persian persian
```

*(Note: The command accepts `gem`, `template`, or `remote` mode. Use what works in your environment. See [The two modes](../modes.md) for more details.)*

Open the generated HTML files in `out_persian/` in your browser. Inspect the page source to check two things:
1. The `<html>` tag should have `dir="rtl"` (or the appropriate direction).
2. The language switcher in the header or menu should correctly link to the available languages.

## 7. Checklist

Before launching your multilingual or RTL site, tick off these steps:

- [ ] `slipway.languages` is configured in `_config.yml`.
- [ ] Every page and post has `lang` defined in its front matter.
- [ ] Translated pages share the same `translation_key`.
- [ ] Custom UI text is added in `_data/i18n/<lang>.yml`.
- [ ] All custom CSS uses logical properties (`npm run check:logical` passes).
- [ ] Mixed-direction content (URLs, English names) is wrapped in `<bdi>` where necessary.
- [ ] The language switcher routes correctly to translated pages or language home pages.
