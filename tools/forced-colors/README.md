# Forced-colors Check

Windows High Contrast and other forced-colors modes replace a page's palette with the user's own: backgrounds become `Canvas`, text becomes `CanvasText`, shadows disappear, and `background-image` URLs are removed. A control that only has a background color, an icon with a fixed fill, or an author `outline: none` can become invisible.

This tool loads every example site with `forced-colors: active`, in light and dark, and reports:

- **focus**: a control reached with `Tab` has no outline.
- **border**: a button, input, select, textarea, or `[role="button"]` has no border, so only its (removed) background told it apart from the page.
- **icon**: an SVG shape uses a fixed `fill` or `stroke` instead of `currentColor`, or an element draws with `background-image`, which forced colors removes. Elements that set `forced-color-adjust: none` are left alone.

Each site is served at its own localhost root, so its stylesheets load, and the home page is checked. A finding prints the site, the color scheme, the rule, the element, and the fix.

To run it standalone:
```bash
node tools/forced-colors/run.mjs
```

It also runs as part of `npm run check`, and prints `SKIP` with a notice when Playwright, its browsers, or Ruby with `bundle install` is missing.
