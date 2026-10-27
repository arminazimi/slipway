# Override slots

Four files let a site add to the theme without forking it or copying a theme file. The theme ships the two includes empty, has no `custom.css`, and ships a plain `social.png`; a site fills a slot by creating the file at the same path. Your file replaces the theme's, and upgrades leave it alone.

They work the same with `remote_theme`, the gem, and "Use this template" (where the files already sit in your site, so you edit them in place).

| Slot | Where it renders | Use it for |
| --- | --- | --- |
| `_includes/head-custom.html` | At the end of `<head>`, on every page | Meta tags, an analytics snippet, a font or stylesheet link |
| `_includes/footer-custom.html` | Inside `<footer>`, after the site title, on every page | An extra line or link, a deferred script |
| `assets/css/custom.css` | Linked after the theme styles and the `slipway.tokens` config, on every page | Overriding tokens or styling your own content |
| `assets/images/social.png` | The `og:image` of every page, the picture shown when a link to the site is shared | Your own 1200 × 630 image |

## Examples

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

`assets/css/custom.css`:

```css
:root { --sl-color-rose: #0b6e4f; }
.my-note { margin-inline-start: var(--sl-space-4); }
```

The [docs example](../examples/docs) fills all three.

## What to keep in mind

- **No `custom.css`, no link.** A page links `assets/css/custom.css` only when your site has that file, so a site without one makes no extra request.
- **`custom.css` has the last word.** It loads after the theme's styles and the tokens set in `_config.yml`, so a token you set there wins. Prefer the [tokens](tokens.md) over styling `.sl-*` classes: tokens are public, class names are not.
- **Scripts stay optional.** Every page must read without JavaScript; add `defer` to scripts, as the theme does.
- **Right-to-left.** Use logical properties (`margin-inline-start`, not `margin-left`) so your styles work in both directions.
- **These three are the supported slots.** Shadowing any other include (for example `head.html`) works, but it is not part of the [public API](adr/0012-public-api.md) and may break in a minor release.

## Component CSS

New components put their CSS in `assets/css/components/<name>.css`. Their include links it once per page through `{% include component-css.html name="<name>" %}`. The CSS budget and logical-property checks cover this folder.
