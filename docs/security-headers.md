# Security Headers

Slipway is designed to be secure by default. It limits its reliance on JavaScript and inline styles, making it straightforward to deploy with a strict Content Security Policy (CSP).

This guide shows how to set up a CSP for a Slipway site, such as via an `.htaccess` file, a `_headers` file (for Cloudflare Pages/Netlify), or equivalent server configuration.

## Content Security Policy (CSP)

A standard CSP for a Slipway site looks like this:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-XGf7ojkkbZv5I86o3Cq4e6de1UCOIrwGFnO2NZTNKQg='; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-src 'none'; object-src 'none';
```

### Directives Explained

- `default-src 'self'`: Only load resources from the same origin by default.
- `script-src 'self' 'sha256-XGf7ojkkbZv5I86o3Cq4e6de1UCOIrwGFnO2NZTNKQg='`: Allow scripts from the same origin, plus the inline script used for theme initialization (light/dark mode) to prevent a flash of unstyled content.
- `style-src 'self' 'unsafe-inline'`: Allow stylesheets from the same origin, and inline styles. **Note:** `'unsafe-inline'` is required because Slipway sets its custom theme variables (tokens) via an inline `<style>` block (`_includes/theme-vars.html`).
- `img-src 'self' data:`: Allow images from the same origin, and data URIs (often used for small inline SVG icons or similar).
- `connect-src 'self'`: Allow network requests (like `fetch` for search) to the same origin.
- `font-src 'self'`: Allow fonts from the same origin.
- `frame-src 'none'`, `object-src 'none'`: Block embedding iframes and plugins unless specifically needed.

### Third-Party Integrations

If you use third-party analytics (like Plausible, GoatCounter, or Umami), or embed content (like YouTube or Twitter), you will need to add their domains to your CSP.

For example, for Plausible Analytics:
```http
script-src 'self' 'sha256-XGf7ojkkbZv5I86o3Cq4e6de1UCOIrwGFnO2NZTNKQg=' https://plausible.io; connect-src 'self' https://plausible.io;
```

## Theme Script Hash

The only inline script shipped with the theme is the dark mode toggle initialization (`_includes/theme-init.html`). Its exact hash is:

`'sha256-XGf7ojkkbZv5I86o3Cq4e6de1UCOIrwGFnO2NZTNKQg='`

If the contents of `_includes/theme-init.html` change in a future theme update, this hash will change, and your CSP will need to be updated. The automated tests (`npm run check`) verify that this documentation stays up to date with the theme's code.
