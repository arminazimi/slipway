<!-- Generated from tokens/theme.tokens.json by tools/theme/tokens-build.mjs. Do not edit. -->
# Theme tokens

Every visual decision in the theme is a CSS custom property, defined once in `tokens/theme.tokens.json` and generated into `assets/css/tokens.css`. After editing the JSON, run `npm run build:tokens`; `npm run check` fails when the CSS or this page is out of date.

Colors use `light-dark()`, so each one is written once and follows the system or the reader's choice of light or dark. Primitive values are the palette; semantic and component tokens point at them and are the ones you restyle.

## Change tokens from `_config.yml`

```yaml
slipway:
  tokens:
    accent: "#7a4f4f"
```

| Key | Sets |
| --- | --- |
| `accent` | `--sl-color-rose`, `--sl-color-rose-fill` |
| `canvas` | `--sl-color-canvas` |
| `text` | `--sl-color-text` |
| `font_display` | `--sl-font-display` |
| `font_body` | `--sl-font-body` |
| `radius` | `--sl-radius-card` |

An override applies to both light and dark, so check its contrast in both. The schema is `schema/slipway-config.schema.json`.

## Primitive values

| Token | CSS variable | Purpose | Light | Dark |
| --- | --- | --- | --- | --- |
| `primitive.sand.100` | (not exposed) | Raised sand, the light surface. | `#efe8de` | same |
| `primitive.sand.200` | (not exposed) | Muted sand, the light page. | `#e9e1d6` | same |
| `primitive.sand.300` | (not exposed) | Sand line, hairlines on light. | `#c9b8ad` | same |
| `primitive.ink.500` | (not exposed) | Quiet ink, light muted text. | `#65574f` | same |
| `primitive.ink.700` | (not exposed) | Soft brown ink, light text and headings. | `#3b3330` | same |
| `primitive.rose.400` | (not exposed) | Dusty desert rose, text on dark. | `#b58d90` | same |
| `primitive.rose.600` | (not exposed) | Dim rose, button fill on dark. | `#7a5558` | same |
| `primitive.rose.700` | (not exposed) | Deep desert rose, text and fills on light. | `#7a4f4f` | same |
| `primitive.charcoal.200` | (not exposed) | Light grey, dark headings. | `#cac4c2` | same |
| `primitive.charcoal.300` | (not exposed) | Soft grey, dark text. | `#b9b2b0` | same |
| `primitive.charcoal.400` | (not exposed) | Mid grey, dark muted text. | `#9a9392` | same |
| `primitive.charcoal.700` | (not exposed) | Charcoal line, hairlines on dark. | `#443f40` | same |
| `primitive.charcoal.800` | (not exposed) | Raised charcoal, the dark surface. | `#2d2a2b` | same |
| `primitive.charcoal.900` | (not exposed) | Charcoal, the dark page. | `#262425` | same |
| `primitive.paper.100` | (not exposed) | Warm paper, text on the light rose fill. | `#f6efe8` | same |
| `primitive.paper.200` | (not exposed) | Pale paper, text on the dark rose fill. | `#efe8e8` | same |

## Color

| Token | CSS variable | Purpose | Light | Dark |
| --- | --- | --- | --- | --- |
| `color.canvas` | `--sl-color-canvas` | Page background. | `#e9e1d6` | `#262425` |
| `color.surface` | `--sl-color-surface` | Raised areas: code blocks, cards. | `#efe8de` | `#2d2a2b` |
| `color.text` | `--sl-color-text` | Body text. | `#3b3330` | `#b9b2b0` |
| `color.heading` | `--sl-color-heading` | Headings. | `#3b3330` | `#cac4c2` |
| `color.muted` | `--sl-color-muted` | Secondary text and captions. | `#65574f` | `#9a9392` |
| `color.line` | `--sl-color-line` | Hairline rules and borders. | `#c9b8ad` | `#443f40` |
| `color.rose` | `--sl-color-rose` | Accent for links, numbers, and marks. | `#7a4f4f` | `#b58d90` |
| `color.rose-fill` | `--sl-color-rose-fill` | Background of filled buttons. | `#7a4f4f` | `#7a5558` |
| `color.on-rose-fill` | `--sl-color-on-rose-fill` | Text on filled buttons. | `#f6efe8` | `#efe8e8` |
| `color.rose-hover` | `--sl-color-rose-hover` | Link hover, derived from the accent. Not part of contrast pairs. | `color-mix(in oklch, var(--sl-color-rose), var(--sl-color-text) 18%)` | same |

## Fonts

| Token | CSS variable | Purpose | Light | Dark |
| --- | --- | --- | --- | --- |
| `font.display` | `--sl-font-display` | Large editorial headings (Latin). | `"Instrument Serif", Georgia, "Times New Roman", serif` | same |
| `font.body` | `--sl-font-body` | Reading text (Latin). | `"Source Serif 4", Georgia, serif` | same |
| `font.ui` | `--sl-font-ui` | Interface chrome: header, navigation, badges, buttons. | `system-ui, -apple-system, "Segoe UI", sans-serif` | same |
| `font.mono` | `--sl-font-mono` | Code. | `"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace` | same |
| `font.persian` | `--sl-font-persian` | All Persian text. | `Vazirmatn, "Source Serif 4", Tahoma, sans-serif` | same |
| `font.arabic` | `--sl-font-arabic` | All Arabic text. | `Vazirmatn, "Source Serif 4", "Geeza Pro", "Segoe UI", Tahoma, sans-serif` | same |

## Type scale

| Token | CSS variable | Purpose | Light | Dark |
| --- | --- | --- | --- | --- |
| `step.sm` | `--sl-step-sm` | Small text step. | `clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem)` | same |
| `step.base` | `--sl-step-base` | Body text step. | `clamp(1rem, 0.96rem + 0.2vw, 1.125rem)` | same |
| `step.lg` | `--sl-step-lg` | Lead text and h3 step. | `clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)` | same |
| `step.xl` | `--sl-step-xl` | h2 step. | `clamp(1.625rem, 1.4rem + 1.1vw, 2.25rem)` | same |
| `step.2xl` | `--sl-step-2xl` | h1 step. | `clamp(2.125rem, 1.7rem + 2vw, 3.25rem)` | same |
| `step.3xl` | `--sl-step-3xl` | Display step for the home page. | `clamp(2.75rem, 2rem + 3.5vw, 4.75rem)` | same |

## Spacing

| Token | CSS variable | Purpose | Light | Dark |
| --- | --- | --- | --- | --- |
| `space.1` | `--sl-space-1` | 4px. | `0.25rem` | same |
| `space.2` | `--sl-space-2` | 8px. | `0.5rem` | same |
| `space.3` | `--sl-space-3` | 12px. | `0.75rem` | same |
| `space.4` | `--sl-space-4` | 16px. | `1rem` | same |
| `space.6` | `--sl-space-6` | 24px. | `1.5rem` | same |
| `space.8` | `--sl-space-8` | 32px. | `2rem` | same |
| `space.12` | `--sl-space-12` | 48px. | `3rem` | same |
| `space.16` | `--sl-space-16` | 64px. | `4rem` | same |

## Radius

| Token | CSS variable | Purpose | Light | Dark |
| --- | --- | --- | --- | --- |
| `radius.compact` | `--sl-radius-compact` | Badges, buttons, code blocks. | `0.375rem` | same |
| `radius.card` | `--sl-radius-card` | Cards and panels. | `0.75rem` | same |

## Measure

| Token | CSS variable | Purpose | Light | Dark |
| --- | --- | --- | --- | --- |
| `measure` | `--sl-measure` | Maximum width of reading text. | `42rem` | same |

## Rule

| Token | CSS variable | Purpose | Light | Dark |
| --- | --- | --- | --- | --- |
| `rule` | `--sl-rule` | Hairline rule width. | `1px` | same |

## Button (component tokens)

| Token | CSS variable | Purpose | Light | Dark |
| --- | --- | --- | --- | --- |
| `button.bg` | `--sl-button-bg` | Filled button background. | `#7a4f4f` | `#7a5558` |
| `button.fg` | `--sl-button-fg` | Filled button text. | `#f6efe8` | `#efe8e8` |
| `button.radius` | `--sl-button-radius` | Button corner radius. | `0.375rem` | same |
