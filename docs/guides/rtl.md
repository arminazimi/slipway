# Multilingual and Right-to-Left Sites

Slipway supports multilingual sites and right-to-left (RTL) text natively. This guide explains how to set up multiple languages, use RTL text, translate the interface, write RTL-safe custom CSS, handle mixed-direction content, and test your site.

## 1. Set up a multilingual site

Configure the languages in `mizzen.yml` (or `slipway.yml`). Under the `languages` key, list each language your site supports, with the URL prefix of its pages:

```yaml
lang: en
languages:
  - { code: en, name: English, prefix: "" }
  - { code: fa, name: فارسی, prefix: "/fa" }
```

Organize your content by creating one folder per language that has a prefix (for example, `/fa/` for Persian).

In the front matter of every page, set the `lang` field to match its language:

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

The theme adds a language switcher to the navigation bar. If a translation for the current page exists (matched by `translation_key`), the switcher links directly to it. If it is missing, the switcher links to that language's home page instead.

## 2. Set up a right-to-left site

The text direction follows `lang` automatically (as defined in [ADR 0010](../adr/0010-ui-strings-and-language-urls.md)). A page with `lang: fa` (Persian), `ar` (Arabic), `he` (Hebrew), or another known RTL language is right-to-left.

Override the direction for a page with `dir` in the front matter, or for the whole site with `dir` in the config:

```yaml
---
title: "Special Page"
lang: en
dir: rtl
---
```

A minimal Persian site config, as in `fixtures/rtl-site`:

```yaml
title: راهنمای بیکن
lang: fa
dir: rtl
```

## 3. Translate the UI text

The theme has built-in UI strings for English (`en`), Persian (`fa`), and Arabic (`ar`), in `packages/theme/i18n/`. A language the theme does not know falls back to the English strings.

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

The theme's own CSS follows this convention; hold your stylesheet to the same rule.

If you are styling components, review the available tokens in the [theme's token registry](../../packages/theme/tokens/README.md) rather than repeating colors or spacing manually.

## 5. Mixed-direction content

When writing RTL text, you may need to include English words, URLs, numbers, or code blocks. Mixed-direction content can sometimes display incorrectly if not isolated.

For now, you must add standard HTML attributes manually to keep mixed content readable in the built output:
- Wrap English words or URLs in Persian text with `<bdi>...</bdi>` (Bi-Directional Isolation) to prevent the browser from flipping punctuation.
- For code blocks that contain English code, apply `dir="ltr"` if your layout allows it, or wrap inline code in `<bdi>`.

**Known limits**: The theme does not yet automatically isolate titles, code, numbers, and URLs. This is tracked in issue [#226](https://github.com/arminazimi/slipway/issues/226).

## 6. Directional icons

Arrows, chevrons, and "next" icons must flip in RTL; logos, check marks, and media controls must not. The theme's `styles/rtl.css` flips the icons it ships; in your own markup, add the `sl-mirror` class to an SVG that must flip:

```html
<svg class="sl-mirror" ...>...</svg>
```

## 7. Test a site in both directions

Build the site and inspect the output:

```bash
npx slipway build
npx slipway doctor . --build dist
```

Open the generated HTML files in `dist/` in your browser. Inspect the page source to check two things:
1. The `<html>` tag should have `dir="rtl"` (or the appropriate direction).
2. The language switcher in the header or menu should link to the available languages.

## 8. Checklist

Before launching your multilingual or RTL site, tick off these steps:

- [ ] `languages` is configured in `mizzen.yml`.
- [ ] Every page has `lang` defined in its front matter.
- [ ] Translated pages share the same `translation_key`.
- [ ] All custom CSS uses logical properties.
- [ ] Mixed-direction content (URLs, English names) is wrapped in `<bdi>` where necessary.
- [ ] The language switcher routes correctly to translated pages or language home pages.
