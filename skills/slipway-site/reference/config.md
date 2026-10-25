<!-- Generated from schema/slipway-config.schema.json by tools/skills/config-reference.mjs. Do not edit. -->
# _config.yml keys

The _config.yml keys the Slipway theme reads. Other keys belong to Jekyll or to plugins and are allowed unchecked.

| Key | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | string |  | Site name, shown in the header, the page title, and the feed. The feed falls back to it when author is unset. |
| `description` | string |  | One-sentence summary of the site, quoted under the title in llms.txt and llms-full.txt. |
| `lang` | string | `en` | Default language of the site as a BCP 47 tag. A page's lang in front matter wins. It picks the interface strings, the date format, and the text direction. |
| `direction` | `ltr` or `rtl` |  | Text direction of every page. Leave it unset to derive it from the language (rtl for fa, ar, he, ur, and other right-to-left languages). A page's direction in front matter wins. |
| `author` | string or object |  | Author of the site, used in the feed. Either a name or an object with a name. |
| `url` | string |  | Scheme and host of the published site, without a trailing slash. Jekyll's absolute_url uses it for the feed, the sitemap, and canonical links; GitHub Pages sets it for you. |
| `baseurl` | string |  | Path the site lives under, such as /my-project, without a trailing slash; empty at a domain root. Jekyll's relative_url and absolute_url use it for every link. |
| `slipway` | object |  | Slipway's own settings. Unknown keys here are rejected, so a typo fails instead of being ignored. |
| `slipway.languages` | list of object | `[]` | Languages of the site, in switcher order. Pages join by lang and translation_key in front matter. Leave it unset for a one-language site. |
| `slipway.languages[].code` | string | required | Language tag that pages use in their lang front matter, such as en or fa. |
| `slipway.languages[].name` | string | required | Name of the language in that language, shown in the switcher, such as فارسی. |
| `slipway.languages[].prefix` | string | required | URL folder of the language home, such as /fa; '' for the default language. |
| `slipway.persian` | object |  | Opt-in Persian conventions for pages whose lang is fa. |
| `slipway.persian.digits` | boolean | `false` | Print dates, reading time, and section numbers with Persian digits. |
| `slipway.persian.jalali` | boolean | `false` | Print post dates in the Jalali calendar. |
| `slipway.tokens` | object |  | Overrides for theme tokens. Each key maps to CSS variables in tools/theme/config-map.mjs. An unset color keeps the theme's light and dark pair; a set one applies to both. |
| `slipway.tokens.accent` | string: A hex color (#rrggbb) or an oklch() color. |  | Accent for links, marks, and filled buttons, in both light and dark. |
| `slipway.tokens.canvas` | string: A hex color (#rrggbb) or an oklch() color. |  | Page background, in both light and dark. |
| `slipway.tokens.text` | string: A hex color (#rrggbb) or an oklch() color. |  | Body text color, in both light and dark. |
| `slipway.tokens.font_display` | string: A CSS font-family list. | `"Instrument Serif", Georgia, "Times New Roman", serif` | Large headings (Latin). |
| `slipway.tokens.font_body` | string: A CSS font-family list. | `"Source Serif 4", Georgia, serif` | Reading text (Latin). |
| `slipway.tokens.radius` | string: A CSS length in rem, em, or px. | `0.75rem` | Corner radius of cards. |
