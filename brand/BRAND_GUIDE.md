# Slipway brand guide

Version `1.0.0` · English-only · Dark-first

This guide turns the Slipway identity into reusable rules for the template, documentation, repository, and social surfaces. Every SVG and PNG here is generated; see [Generated files](#generated-files). The decision behind the mark and the palette is [ADR 0005](../docs/adr/0005-brand-mark-and-palette.md).

Slipway is one of a family of products that share a visual language (rings on a 256 px canvas, dark-first, flat), each in its own color: Evergreen in green, Seaworthy in desert rose, a third product in blue, and Slipway in bronze.

## Core identity

**Product name:** Slipway  
**Tagline:** Build on Slipway.  
**Secondary line:** Ship Seaworthy.  
**Descriptor:** Agent-native sites for GitHub Pages.

Use the tagline everywhere a single line is needed. The secondary line is for banners and launch art, where it points to Seaworthy, the tool that verifies every Slipway site; it never replaces the tagline. Use the descriptor when category clarity matters. Do not rename the product `Slipway Theme`, `Slipway AI`, or any other variant.

A slipway is the ramp a ship is built on and launched down into the water. A Slipway site is built on the template and launched onto the web.

## Logo system

The mark is two concentric rings cut by one diagonal slip, with a gap between the halves.

- The part **above the slip** (light) is what you write: the source.
- The part **below the slip** (bronze) is what ships: the site that goes into the water.
- The **slip** slopes at 35 degrees, the way a ramp does, and cuts both rings in one line so they read as one object.

### Approved variants

| Context | Asset |
| --- | --- |
| Dark brand surface | `assets/slipway-mark-dark.svg` |
| Light brand surface | `assets/slipway-mark-light.svg` |
| One-color, dark surface | `assets/slipway-mark-mono.svg` |
| One-color, light surface | `assets/slipway-mark-mono-light.svg` |

Use SVG for anything scalable or editable. Use the PNG next to each SVG where a platform needs a raster image.

### Clear space

Keep clear space equal to one eighth of the mark width (12.5%) on every side. For a 256 px mark that is 32 px. No text, frame, crop, or unrelated graphic may enter that area.

### Minimum size

- Full-color mark: 32 px wide on screen, 8 mm in print.
- One-color mark: 24 px wide on screen, 6 mm in print.
- Wordmark lockup: 140 px wide on screen, 35 mm in print.
- Do not use the full mark below 24 px. Its thin rings and gap do not hold at 16 px. Use the favicon mark (below) for 16 to 48 px.

### Favicon mark

For browser tabs, app icons, and anything between 16 and 48 px, use the simplified mark in [`favicon/`](favicon/): one thick ring cut by the same slip, on a canvas tile. Every stroke and the gap are at least 2 px at 16 px. Never shrink the full mark instead, and never use the favicon mark above 48 px where the full mark fits.

| File | Size | Use |
| --- | ---: | --- |
| `favicon.svg` | scalable | Browsers that support SVG icons (rounded tile) |
| `favicon.ico` | 16, 32, 48 | Browsers and tools that only read .ico |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | 16, 32, 48 | Fixed-size fallbacks |
| `apple-touch-icon.png` | 180 | iOS home screen (full-bleed; iOS rounds it) |
| `icon-192.png`, `icon-512.png` | 192, 512 | Web app manifest (full-bleed) |
| `icon-square.svg` | scalable | Source for the full-bleed icons |

```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

### Correct use

- Preserve the exact geometry, proportions, angle, and gap.
- Use an approved variant with enough contrast.
- Scale uniformly from the center.
- Use the mark alone for avatars, badges, and small UI. Use the lockup (mark, wordmark, tagline) for banners and headers.

### Incorrect use

- Do not rotate, skew, stretch, crop, outline, or add shadows or gradients.
- Do not close the gap, fill the rings, remove a ring, or change the angle of the slip.
- Do not swap the two colors of the halves or recolor parts outside the approved variants.
- Do not animate the mark as a loading spinner.
- Do not place the color mark on photography, gradients, or low-contrast colors.
- Do not use a ship, anchor, wave, ramp icon, or generic AI sparkle as an alternate Slipway symbol.

## Color

The canonical values are in [`tokens.json`](tokens.json), with CSS custom properties in [`tokens.css`](tokens.css). The palette is called quiet bronze: calm, low in saturation, and easy on the eyes.

| Token | Value | Role |
| --- | --- | --- |
| Canvas | `#17130F` | Primary dark canvas |
| Surface | `#26201A` | Elevated dark surface |
| Bronze | `#B8975A` | Main accent on dark surfaces; the lower half of the mark |
| Bronze Soft | `#8C7648` | Accent on light surfaces, for graphics and borders only |
| Ink Bronze | `#5E4A26` | Text and thin lines on light surfaces |
| Tint | `#D9C9A3` | Soft highlight on dark surfaces |
| Light | `#F4EFE4` | Primary light canvas; the upper half of the mark on dark surfaces |
| Text | `#E6DFD0` | Body text on dark surfaces |
| Mist | `#A39880` | Secondary text on dark surfaces |

Slipway has no status colors of its own. Verification results belong to Seaworthy, and its pass, warning, and error colors are not part of this palette.

### Accessible color pairs

Ratios use WCAG relative luminance. Normal text needs 4.5:1; large text and meaningful graphics need 3:1. The pairs below stay well above that, and the dark pairs stay below pure white on black on purpose: they are easier on the eyes.

| Foreground | Background | Ratio | Approved use |
| --- | --- | ---: | --- |
| Text | Canvas | 13.93:1 | Text and UI |
| Text | Surface | 12.14:1 | Text and UI |
| Light | Canvas | 16.11:1 | Text and UI; the light half of the mark |
| Tint | Canvas | 11.29:1 | Text and UI |
| Bronze | Canvas | 6.70:1 | Text and UI; the lower half of the mark |
| Bronze | Surface | 5.84:1 | Text and UI |
| Mist | Canvas | 6.48:1 | Secondary text |
| Mist | Surface | 5.64:1 | Secondary text |
| Canvas | Light | 16.11:1 | Text and UI; the mark on light surfaces |
| Ink Bronze | Light | 7.37:1 | Text and UI on light surfaces |
| Canvas | Bronze | 6.70:1 | Badge: the word slipway |

**Not approved for text:** Bronze Soft on Light (3.82:1, graphics and borders only), Bronze on Light (2.41:1), and Ink Bronze on Canvas (2.19:1). Use Ink Bronze on light surfaces and Bronze on dark ones.

## Typography

Use **Inter** (variable, weights 400 to 700) for the wordmark, headings, body copy, and brand UI. The wordmark is uppercase, weight 700, with about `0.1em` of positive tracking. Use **IBM Plex Mono** (weights 400 and 500) for commands, paths, and the tagline in brand art.

This is the brand's type, shared with the other products. The Slipway template has its own fonts for site content (see [ADR 0004](../docs/adr/0004-fonts.md)); they are chosen for Latin and Persian reading, not for brand art.

The generated sources use common fallbacks so they stay editable without bundled fonts. PNG exports are the rendered result on the machine that exported them; re-export on a machine with Inter and IBM Plex Mono installed for the final look.

## Built-with badge

Every Slipway site may show a badge that says it was built with Slipway. It has a Surface left segment with the one-color mark and the words `built with`, and a Bronze right segment with the word `slipway`. The words carry the meaning, not the color.

```markdown
![built with slipway](https://raw.githubusercontent.com/arminazimi/slipway/main/brand/assets/badge-built-with.svg)
```

The badge is generated by `tools/brand/badge.mjs`, so the template can build it too. It says nothing about whether a site passes verification; that is Seaworthy's badge.

## Voice

Plain, specific, and checkable. Say what a thing does and how to use it.

- Lead with the command or the result, not the pitch.
- No hype words: skip "AI-powered", "seamless", "unlock", "supercharge".
- Sentence case for headings and buttons. Uppercase only in the wordmark and brand-art taglines.

## Spacing and shape

Use the 4 px base scale from `tokens.json`; prefer 16, 24, 32, 48, and 64 px. Use 8 px radius for compact UI, 16 px for cards, and 24 px for presentation panels. The mark itself never gets a container shape unless a platform requires an avatar crop.

## Social assets

The social preview, banner, avatar, and template thumbnail are a separate task (`brand.social`) that builds on this kit.

## Generated files

Do not edit these by hand. They come from `tools/brand/` and `tokens.json`.

| Output | Regenerate with |
| --- | --- |
| `assets/*.svg`, `favicon/*.svg`, `slipway-logo-sheet.svg`, `tokens.css` | `npm run build:brand` |
| `assets/*.png`, `favicon/*.png`, `favicon/favicon.ico`, `slipway-logo-sheet.png` | `npm run export:brand` (needs Chrome or Chromium) |

`npm run check` fails when the SVG sources are out of date or a PNG export is missing. The mark's geometry lives in `tools/brand/mark.mjs`.

## Asset rights

Slipway code is available under the MIT license. That license does not grant any right to the project's name, logo, or other marks, so the name and brand assets are not licensed for use that suggests endorsement. The brand-use policy is in [USAGE_POLICY.md](USAGE_POLICY.md).
