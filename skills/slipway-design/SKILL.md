---
name: slipway-design
description: Restyle a Slipway site with design tokens and a preset, add CSS through the override slots, and keep light and dark contrast passing.
metadata:
  version: "0.2.0"
---

# Restyle a Slipway site

A Slipway site's look comes from `_config.yml` and four override slots, never from edited theme files. The theme ships an editorial serif, a warm sand palette, and one accent; a preset changes those through tokens and CSS variables that stay public across releases. If the site has an `AGENTS.md`, read it first; it wins where it differs.

## 1. Take a baseline

Get the theme's checks once, into a folder outside the site. Run section 6 before you change anything and keep the output: the restyle is done when it adds no finding and no failed pair.

```sh
git clone --depth 1 https://github.com/arminazimi/slipway "$HOME/.slipway"
cd "$HOME/.slipway" && npm ci && cd -
```

In the theme checkout, run the checks the theme ships. Each must print `OK` before and after:

```sh
cd "$HOME/.slipway"
npm run check:contrast
npm run check:logical
npm run check:css
npm run check:js
```

They cover the theme's own tokens and files, so they stay green when the theme is untouched. The site still has to keep the rules they enforce, and the ratios they use are yours to meet (section 4).

## 2. Choose the preset

Slipway has no `slipway.preset` key. A preset is a complete set of the values below, written into the site and applied together; change it as a whole, not one key at a time, or the result drifts. Start from the theme's defaults in [docs/tokens.md](https://github.com/arminazimi/slipway/blob/main/docs/tokens.md) or the commented values in `examples/minimal/_config.yml`, then decide:

- **Type.** `font_display` for large headings, `font_body` for reading. The page self-hosts Instrument Serif, Source Serif 4, and Vazirmatn, so name those or a system stack: a family the page does not load falls back silently. `slipway.fonts: system` downloads no font at all. A new family means font files and a link in `_includes/head-custom.html`, and it counts toward page weight ([ADR 0004](https://github.com/arminazimi/slipway/blob/main/docs/adr/0004-fonts.md)).
- **Color.** One accent and a canvas and text pair. Text colors need two values, one per mode, so set them in `assets/css/custom.css` (section 4) rather than `_config.yml`.
- **Shape.** `radius` rounds cards; `--sl-radius-compact` rounds badges, buttons, and code blocks.
- **Mark.** `slipway.logo.light` and `slipway.logo.dark` point at a logo in the site; `slipway.logo.favicon_svg` and `slipway.logo.touch_icon` at its icons.
- **Header.** `slipway.header`: `classic`, `centered`, or `minimal`.

Every key you may set is listed in [reference/config.md](../slipway-site/reference/config.md), and what each token changes is in [docs/tokens.md](https://github.com/arminazimi/slipway/blob/main/docs/tokens.md).

## 3. Set the fonts and shape tokens

```yaml
slipway:
  header: centered
  tokens:
    font_display: '"Instrument Serif", Georgia, "Times New Roman", serif'
    font_body: '"Source Serif 4", Georgia, serif'
    radius: 0.5rem
```

`slipway.tokens` accepts only `accent`, `canvas`, `text`, `font_body`, `font_display`, and `radius`; the schema rejects anything else, so a typo fails instead of being ignored. Colors are `#rrggbb` or `oklch(...)`; lengths are `rem`, `em`, or `px`.

A color set here applies to light and dark alike. Text must be dark on a light canvas and light on a dark one, so one value cannot pass in both modes: leave `accent`, `canvas`, and `text` unset and do colors in `assets/css/custom.css`.

## 4. Set the colors in `assets/css/custom.css`

The theme sets `color-scheme`, so `light-dark()` works here, and the file loads after the theme styles and the config tokens. This green accent passes AA on both canvases and surfaces:

```css
:root {
  --sl-color-rose: light-dark(#4a5c2f, #b9c69b);
  --sl-color-rose-fill: light-dark(#4a5c2f, #556b3a);
  --sl-color-on-rose-fill: light-dark(#f6efe8, #efe8e8);
  --sl-button-bg: var(--sl-color-rose-fill);
  --sl-button-fg: var(--sl-color-on-rose-fill);
}
```

`--sl-color-rose` is link and mark text; `--sl-color-rose-fill` is the fill of filled buttons and status badges. The button rules read `--sl-button-bg` and `--sl-button-fg`, which keep the old values until you re-point them as above. `--sl-color-rose-hover` is derived from the accent, so it follows. Check every pair in both modes:

- `--sl-color-text`, `--sl-color-heading`, `--sl-color-muted`, and `--sl-color-rose`, each on `--sl-color-canvas` and on `--sl-color-surface`: at least 4.5:1.
- `--sl-color-on-rose-fill` on `--sl-color-rose-fill`: at least 4.5:1.

The ratio is `(lighter + 0.05) / (darker + 0.05)` on WCAG relative luminance; `contrastRatio` in `tools/theme/contrast.mjs` is the function the theme's check uses, and its test pins known values. 4.5:1 covers text, 3:1 large text and interface marks. A palette that changes `--sl-color-canvas`, `--sl-color-surface`, `--sl-color-text`, `--sl-color-heading`, `--sl-color-muted`, or `--sl-color-line` must change and re-check all of them together.

## 5. Add to the theme through the slots

| Slot | What it does |
| --- | --- |
| `assets/css/custom.css` | Your CSS, linked after the theme styles and config tokens, only when the file exists |
| `_includes/head-custom.html` | End of `<head>` on every page: meta tags, a font stylesheet |
| `_includes/footer-custom.html` | Inside `<footer>` on every page: a line, a deferred script |
| `assets/images/social.png` | The `og:image` a shared link shows, 1200 × 630 |

Prefer the `--sl-*` variables to styling `.sl-*` classes: the variables are public, the class names are internal and may change in a minor release. Write your own classes for your own content. Use logical CSS properties so right-to-left works: `margin-inline-start`, `padding-inline`, `border-inline-start`, `max-inline-size`, never `left`, `right`, or `width` alone. `npm run check:logical` fails on the physical ones in the theme's CSS; hold your file to the same rule. Every page must read without JavaScript: add `defer` to any script. Details are in [docs/overrides.md](https://github.com/arminazimi/slipway/blob/main/docs/overrides.md) and [the customization guide](https://github.com/arminazimi/slipway/blob/main/site/guides/customize.md).

## 6. Check the restyle

From the site folder, validate the config and every front matter block, build, and run the doctor:

```sh
node "$HOME/.slipway/tools/theme/validate.mjs" .
bundle exec jekyll build
node "$HOME/.slipway/packages/doctor/bin/slipway.mjs" doctor . --build _site
```

Each problem is printed as `file:line key: message`. Fix it at that line and run it again. The doctor must keep the level and finding count of your baseline; a finding that names your file is yours to fix. Without a `Gemfile`, push and read the log of the Pages build.

Look at one page in both modes with `bundle exec jekyll serve`: the theme toggle and the system setting each have to work. Then keep the budgets the theme is tested at: 42 KB of CSS and 10 KB of JS, and a 100 KB home page or 150 KB doc or post page, HTML, CSS, JS, and fonts included. Your `assets/css/custom.css` and any font you add count toward the page weight; keep the file small and the extra requests at zero when the preset allows.

## Never

- Never edit or copy theme layouts, includes, `assets/css/slipway.css`, or `assets/css/tokens.css`; use tokens and the slots.
- Never give a changed color one value for both modes; set it with `light-dark()`, check both, or leave the pair as the theme has it.
- Never name a font family the page does not load; it falls back silently.
- Never style `.sl-*` classes to restyle a component; set the token it reads.
- Never add a script that blocks rendering, or a control that shows without JavaScript.
- Never lower the doctor's `level`, drop `--build`, or edit a built folder to make a check pass.
