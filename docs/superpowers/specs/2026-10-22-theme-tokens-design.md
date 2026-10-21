# Theme design tokens and editorial type system: design

Epic: #3 (issues #4, #5, #6, #7, #8, #56, #57). Status: draft for review.

## Intent

Slipway's default theme is calm and easy on the eyes: a muted sand page, soft ink, and a dusty desert rose as the only accent. Every visual decision is a CSS custom property, so changing three tokens in `_config.yml` restyles the demo site without editing CSS. Dark mode follows the system, can be switched by hand, and does not flash on load.

Said by the user: no loud colors; the logo's bronze must not mix with rose; light mode is fine as shown; dark mode must be soft (Charcoal); advanced where there is room.
Assumed: the Latin and Persian fonts stay as in ADR 0004; the epic's exit criterion is "three tokens restyle the demo; all text tokens pass WCAG AA in light and dark".

## Visual direction

A+B hybrid.

- Content (headings, prose, numbered sections, hairline rules): editorial, serif, per ADR 0004.
- Chrome (header, nav, badges, code blocks, cards): technical, sans and mono, small radii.

## Palette (final)

| Token | Light | Dark (Charcoal) |
| --- | --- | --- |
| canvas | `#E9E1D6` | `#262425` |
| surface | `#EFE8DE` | `#2D2A2B` (derived, checked by #56) |
| text | `#3B3330` | `#B9B2B0` |
| heading | `#3B3330` | `#CAC4C2` |
| muted | `#65574F` | `#9A9392` |
| line | `#C9B8AD` | `#443F40` |
| rose (text, links) | `#7A4F4F` | `#B58D90` |
| rose fill (buttons) | `#7A4F4F` with text `#F6EFE8` | `#7A5558` with text `#EFE8E8` |

Measured contrast (WCAG): light text 9.5, muted 5.4, rose 5.3, button 6.0; dark text 7.4, heading 9.0, rose 5.3. Bronze is not part of the theme. The logo keeps its own palette.

ADR 0005 covers the brand palette; this decision adds ADR 0008 (theme palette) in the PR for #4.

## Architecture

1. **Source of truth:** `tokens/theme.tokens.json` in the W3C Design Tokens (DTCG) format, with three tiers: primitive (raw values), semantic (`color.text`, `color.rose`), component (`button.bg`).
2. **Generated CSS:** `assets/css/tokens.css` is generated from the JSON by `tools/theme/` and committed. A test fails when the file is out of date. The Pages build runs no generator, so classic Pages mode works.
3. **Modern CSS:** `@layer reset, tokens, base, components, utilities`; colors in `oklch()` with `color-mix()` for tints; `light-dark()` so each color is written once; `color-scheme: light dark`; `@property` for typed tokens (spacing, durations).
4. **Ramp:** one 12-step oklch ramp is derived from each seed (rose, neutral), so changing the seed restyles everything.
5. **Fluid type:** a type scale with `clamp()`; spacing scale on a 4px grid in `rem`.
6. **Accessibility modes:** `prefers-contrast: more` raises text and line tokens; `forced-colors` falls back to system colors; `prefers-reduced-motion` removes the transition.
7. **Config mapping (#6):** `_config.yml` has a `slipway.tokens` block (the `theme:` key is Jekyll's theme name) with overrides only. An include writes them as `:root` custom properties. `schemas/theme-config.schema.json` validates the block, and the same schema is used by tests and by agents.

## Dark mode (#5)

- States: auto (system), light, dark. Stored in `localStorage`; applied as `data-theme` on `<html>`.
- A small inline script in `<head>` (under 400 bytes) sets `data-theme` before first paint, so there is no flash.
- The toggle changes `color-scheme`, so form controls and scrollbars follow.
- The switch animates with View Transitions when supported; otherwise it is instant.
- Without JavaScript, the page follows the system through `light-dark()`.

## Editorial signature (#7)

Instrument Serif for large headings, Source Serif 4 for text, Vazirmatn for Persian (ADR 0004), numbered sections through CSS counters, 1px hairline rules in `line`, logical properties only.

## Contrast test (#56)

A script reads the tokens, resolves `light-dark()`, and checks every text and background pair for WCAG AA in both modes. It also prints APCA values, which do not block. The test runs in `npm run check`.

## Print (#57), documentation (#8)

Print stylesheet: light palette, no chrome, URLs after links. `docs/tokens.md` is generated from the JSON, one row per token with its purpose and value.

## Delivery

Order: #4 (with ADR 0008), then #6, #5, #7 in parallel-safe order, then #56, #8, #57. One branch, one PR, and one merge per issue, each with `Closes #N` and a green `npm run check`.

## Out of scope

Layouts (epic #9), search, navigation, and fonts hosting beyond what ADR 0004 already decided.
