---
title: Customization Guide
description: Learn how to customize your Slipway site using tokens, presets, override slots, and custom CSS.
layout: doc
permalink: /guides/customize/
date: 2026-10-26
author: Slipway
---

This guide details how to change the look and behavior of a Slipway site without forking the theme.

## Tokens

Tokens are CSS custom properties that control the visual design of the theme. You can override them in your `_config.yml` file under the `slipway.tokens` key.

```yaml
slipway:
  tokens:
    accent: "#0b6e4f"
    canvas: "#ffffff"
    text: "#222222"
    font_body: "Georgia, serif"
    font_display: '"Instrument Serif", Georgia, serif'
    radius: "0.5rem"
```

These overrides apply to both light and dark modes. Ensure your chosen colors maintain sufficient contrast in both. For a full list of available tokens, see the [Tokens reference](/config/).

## Presets

While Slipway doesn't offer one-click presets, you can easily copy and paste complete token sets from our examples into your `_config.yml` to change your site's aesthetic.

## Override slots

You can inject custom HTML or CSS into specific areas of your site without modifying the theme files directly. These are called override slots.

Create these files at the root of your site (or in your `source_dir`):

*   `_includes/head-custom.html`: Appended to the `<head>` of every page. Use it for meta tags, analytics scripts, or custom fonts.
*   `_includes/footer-custom.html`: Appended to the `<footer>` of every page, after the site title. Use it for an extra line of text or deferred scripts.
*   `assets/css/custom.css`: Appended after the theme's CSS and generated `tokens.css` on every page. Use it to override tokens or style your own content.
*   `assets/images/social.png`: The default Open Graph image (`og:image`) for your site.

### Examples

`_includes/head-custom.html`:

```html
<meta name="author" content="Ada Lovelace">
<script src="https://analytics.example.com/script.js" defer></script>
```

`_includes/footer-custom.html`:

```html
<p>Code under <a href="https://opensource.org/license/mit">MIT</a>.</p>
<p><a href="https://github.com/you/your-site">Source on GitHub</a></p>
```

## Custom CSS

For styling changes beyond what `_config.yml` tokens allow, use the `assets/css/custom.css` override slot.

```css
/* assets/css/custom.css */

/* Override a public token using the CSS custom property */
:root {
  --sl-color-rose: #0b6e4f;
}

/* Style your own specific classes */
.my-custom-note {
  margin-inline-start: var(--sl-space-4);
  padding: var(--sl-space-4);
  background: var(--sl-color-surface);
}
```

*   **No custom CSS, no request**: The file is only linked if it exists in your site, avoiding unnecessary 404 requests.
*   **Logical properties**: Use logical properties (`margin-inline-start`, not `margin-left`) so your styles work in right-to-left languages.
*   **Precedence**: `custom.css` loads last. A token set in `_config.yml` overrides the theme's default, but `custom.css` has the final say. Prefer `_config.yml` for tokens when possible.
