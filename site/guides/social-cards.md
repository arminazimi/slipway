---
title: Social cards
description: How Slipway picks the picture a shared link shows, in both modes, and how to replace or restyle it.
layout: doc
permalink: /guides/social-cards/
date: 2026-10-26
author: Slipway
---

A social card is the picture a chat app, a social network, or a search result shows when someone shares a link to your site. Slipway gives every page one, and this site's pages share the card below unless a page sets its own.

![The shared Slipway social card: a dark 1200 by 630 image with the Slipway mark and name](/assets/images/social.png)

## How a page picks its picture

`_includes/seo.html` resolves the picture in three steps, and the first one that applies wins:

1. **The page's `image` front matter.** A path on your site or an `https` URL. It works in either mode.
2. **A card generated from the title.** Only in Actions mode, and only when the site copies the plugin (see below).
3. **The shared `assets/images/social.png`.** Every other page, in every mode.

The rule is plain Liquid, so classic Pages and Actions mode read the same file and agree on the result.

## Classic Pages: one picture for the site

GitHub Pages runs no plugins, so it cannot draw a picture per page. Without `image` in a page's front matter, every page points at the theme's `assets/images/social.png`: the card above.

To use your own picture for the whole site, put a file at the same path in your repository:

```
assets/images/social.png
```

Your file replaces the theme's, and theme updates leave it alone. This is the fourth [override slot](/guides/customize/#override-slots); it works with `remote_theme`, the gem, and "Use this template". Use a 1200 × 630 PNG, which is the size the theme ships and the size `seo.html` declares in the page head.

## Actions mode: one picture per page

A theme cannot ship plugins, so Actions mode is opt-in per site: copy `_plugins/slipway_og.rb` from the theme into your site's `_plugins/` folder, the way a site adopts the twins or source-map plugin. Then every build writes a card for each written page, from its title:

| Page address | Generated picture |
| --- | --- |
| `/` | `assets/images/og/index.png` |
| `/about.html` | `assets/images/og/about.png` |
| `/guides/migration/` | `assets/images/og/guides/migration.png` |

The plugin sets `page.slipway_og`, which `seo.html` reads, so a page needs no front-matter change. The pictures exist in the built site only: do not commit them, and a renamed page gets a renamed picture at the next build. When two addresses would collapse onto one file name (`/about.html` and `/about/`), the plugin adds a short suffix, so the name stays stable across builds.

Each picture is a 1200 × 630 PNG drawn with Ruby's standard library alone: the theme's dark background, an accent bar across the top, the site title in muted text above, and the page title in up to three lines, shrunk to fit. There are no fonts to install and no image tools to run.

Two cases keep the shared card:

- **A page with `image` in its front matter.** The page's own picture wins; the plugin skips it.
- **A title the embedded font cannot draw.** The font covers printable ASCII, so punctuation such as curly quotes, en and em dashes, and the ellipsis is folded to its ASCII stand-in. A title with any other character left, such as a Persian or Chinese one, is skipped rather than drawn as holes, and the page falls back to `assets/images/social.png`.

## Give one page its own picture

Set `image` in the page's front matter, with a path that starts with `/` or an `https://` URL:

```yaml
---
title: Release notes for 1.0
image: /assets/images/cards/release-1-0.png
---
```

The page then points at that picture in both modes, whether or not the plugin runs. A 1200 × 630 image gives a large preview; other sizes work, but Slipway cannot declare their dimensions because it does not know them. The full set of keys is in the [front matter reference](/front-matter/).

## What the page head contains

For the picture it resolved, `seo.html` writes:

- `og:image`, made absolute with your site's `url`. Set `url` in `_config.yml` when you build outside GitHub Pages, where `jekyll-github-metadata` fills it in; without it the value stays relative and scrapers cannot fetch it.
- `og:image:alt`, the page title.
- `twitter:card`: `summary_large_image` when the page has its own or a generated picture, and `summary` when it uses the shared one. A site that never touches images shares exactly as it did before per-page cards existed.
- `og:image:width` and `og:image:height`, both 1200 and 630, only for the shared and generated pictures, whose size Slipway knows.

Every page gets a card; there is no front-matter key that removes it.

## Restyle the generated picture

The generated card has no template file and no config keys. Its look is a set of constants near the top of `_plugins/slipway_og.rb`:

- `BACKGROUND`, `TEXT`, `MUTED`, and `ACCENT` are the colors, as RGB triples; they start as the theme's dark palette.
- `MARGIN` is the space around the text, `BAR` the height of the accent bar across the top, and `SCALES` the glyph sizes the title is tried at, largest first.

Because you copied the plugin into your site, editing those constants is safe: theme updates do not touch your copy, and the pictures are rewritten on every build. If you want more than a title on a card, or a different picture for each section, set `image` per page instead; leaving the plugin out and replacing `assets/images/social.png` also works, and every page then shares that one picture.

## Limits to know

- **Raster, not vector.** Scrapers take PNG or JPEG, not SVG, which is why the theme ships a PNG and the plugin draws pixels.
- **The font is ASCII.** Non-Latin titles keep the shared card in Actions mode; a page that needs a card in its own script should set `image`.
