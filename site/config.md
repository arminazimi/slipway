---
title: Configuration
description: Slipway configuration reference.
layout: doc
permalink: /config/
date: 2026-10-26
author: Slipway
---
<!-- Generated from schema/slipway-config.schema.json by tools/theme/config-doc.mjs. Do not edit below this line. -->

The _config.yml keys the Slipway theme reads. Other keys belong to Jekyll or to plugins and are allowed unchecked.

| Key | Type | Default | What it does |
| --- | --- | --- | --- |
| `author` | string or object |  | Author of the site, used in the feed and as the author in the JSON-LD of posts and docs. Either a name or an object with a name. |
| `baseurl` | string |  | Path the site lives under, such as /my-project, without a trailing slash; empty at a domain root. Jekyll's relative_url and absolute_url use it for every link. |
| `description` | string |  | One-sentence summary of the site, quoted under the title in llms.txt and llms-full.txt. |
| `direction` | `ltr` or `rtl` |  | Text direction of every page. Leave it unset to derive it from the language (rtl for fa, ar, he, ur, and other right-to-left languages). A page's direction in front matter wins. |
| `lang` | string | `en` | Default language of the site as a BCP 47 tag. A page's lang in front matter wins. It picks the interface strings, the date format, and the text direction. |
| `slipway` | object |  | Slipway's own settings. Unknown keys here are rejected, so a typo fails instead of being ignored. |
| `slipway.analytics` | object |  | Opt-in, privacy-friendly analytics. |
| `slipway.analytics.goatcounter` | string |  | Your GoatCounter endpoint URL. |
| `slipway.analytics.plausible` | string |  | The domain name of your site to enable Plausible Analytics. |
| `slipway.analytics.umami` | object |  | Umami analytics configuration. |
| `slipway.analytics.umami.url` | string |  | The URL to the Umami script. Defaults to https://analytics.umami.is/script.js. |
| `slipway.analytics.umami.website_id` | string | required | Your Umami website ID. |
| `slipway.arabic` | object |  | Opt-in Arabic conventions for pages whose lang is ar. |
| `slipway.arabic.digits` | boolean | `false` | Print dates, reading time, and section numbers with Arabic-Indic digits. |
| `slipway.arabic.hijri` | boolean | `false` | Print post dates in the Hijri calendar. |
| `slipway.comments` | object |  | Opt-in comments via giscus, on every post. Docs pages and the rest of the site stay comment-free. |
| `slipway.comments.category` | string | required | The name of the discussion category the comments open discussions in, such as Announcements. |
| `slipway.comments.categoryId` | string | required | The ID of that category, from the giscus setup at giscus.app. |
| `slipway.comments.dark` | string | `dark` | The giscus theme for the site's dark mode, a built-in name such as dark_dimmed or the URL of a custom theme. Defaults to dark. |
| `slipway.comments.lang` | string |  | The language giscus displays in, such as zh-CN, when it differs from the site language. A site language giscus does not know falls back to en. |
| `slipway.comments.light` | string | `light` | The giscus theme for the site's light mode, a built-in name such as light_high_contrast or the URL of a custom theme. Defaults to light. |
| `slipway.comments.mapping` | `pathname` or `url` or `title` or `og:title` or `specific` or `number` | `pathname` | How a post finds its discussion: by its path, its URL, its title, its og:title, or a fixed term or number. Defaults to pathname. |
| `slipway.comments.repo` | string | required | The GitHub repository whose discussions hold the comments, as owner/name. |
| `slipway.comments.repoId` | string | required | The ID of that repository, from the giscus setup at giscus.app. |
| `slipway.fonts` | `default` or `system` | `default` | Font loading. default self-hosts the theme fonts; system downloads nothing and falls back to system fonts. |
| `slipway.header` | `classic` or `centered` or `minimal` | `classic` | Header layout. classic puts the title at the start and navigation, search, and the toggles at the end; centered stacks them on the middle axis; minimal shows only the title, the language switcher, and the theme toggle. |
| `slipway.languages` | list of object | `[]` | Languages of the site, in switcher order. Pages join by lang and translation_key in front matter. Leave it unset for a one-language site. |
| `slipway.languages[].code` | string | required | Language tag that pages use in their lang front matter, such as en or fa. |
| `slipway.languages[].name` | string | required | Name of the language in that language, shown in the switcher, such as فارسی. |
| `slipway.languages[].prefix` | string | required | URL folder of the language home, such as /fa; '' for the default language. |
| `slipway.logo` | object |  | Site logo and favicons. |
| `slipway.logo.dark` | string |  | Path to the dark-mode logo (shown when the dark theme is active), relative to the site root. |
| `slipway.logo.favicon_svg` | string |  | Path to an SVG favicon, relative to the site root. |
| `slipway.logo.light` | string |  | Path to the light-mode logo (shown by default), relative to the site root, such as /assets/img/logo.svg. |
| `slipway.logo.touch_icon` | string |  | Path to an Apple touch icon (180x180 PNG), relative to the site root. |
| `slipway.persian` | object |  | Opt-in Persian conventions for pages whose lang is fa. |
| `slipway.persian.digits` | boolean | `false` | Print dates, reading time, and section numbers with Persian digits. |
| `slipway.persian.jalali` | boolean | `false` | Print post dates in the Jalali calendar. |
| `slipway.social` | list of object |  | Social icons for the links layout. |
| `slipway.social[].icon` | string | required | The icon name in _includes/icons/. |
| `slipway.social[].title` | string | required | Accessible name for the social icon. |
| `slipway.social[].url` | string | required | The URL of the social profile. |
| `slipway.source_dir` | string |  | Folder where the site lives in the repository, such as docs, to prefix source paths in the edit prompt. |
| `slipway.tokens` | object |  | Overrides for theme tokens. Each key maps to CSS variables in tools/theme/config-map.mjs. An unset color keeps the theme's light and dark pair; a set one applies to both. |
| `slipway.tokens.accent` | string: A hex color (#rrggbb) or an oklch() color. |  | Accent for links, marks, and filled buttons, in both light and dark. |
| `slipway.tokens.canvas` | string: A hex color (#rrggbb) or an oklch() color. |  | Page background, in both light and dark. |
| `slipway.tokens.font_body` | string: A CSS font-family list. | `"Source Serif 4", Georgia, serif` | Reading text (Latin). |
| `slipway.tokens.font_display` | string: A CSS font-family list. | `"Instrument Serif", Georgia, "Times New Roman", serif` | Large headings (Latin). |
| `slipway.tokens.radius` | string: A CSS length in rem, em, or px. | `0.75rem` | Corner radius of cards. |
| `slipway.tokens.text` | string: A hex color (#rrggbb) or an oklch() color. |  | Body text color, in both light and dark. |
| `title` | string |  | Site name, shown in the header, the page title, and the feed. The feed falls back to it when author is unset. |
| `url` | string |  | Scheme and host of the published site, without a trailing slash. Jekyll's absolute_url uses it for the feed, the sitemap, and canonical links; GitHub Pages sets it for you. |
