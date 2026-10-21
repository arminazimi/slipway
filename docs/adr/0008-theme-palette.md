# 0008. Theme palette: desert rose on muted sand and charcoal

**Status:** Accepted (2026-10-22)

## Context

[ADR 0005](0005-brand-mark-and-palette.md) fixed the palette of the mark and the brand kit: quiet bronze. The site theme needs its own palette for pages that people read for a long time. The maintainer's brief: nothing loud, easy on the eyes, a desert rose in the theme, and no mixing of the logo's bronze with the rose. Samples were compared with the maintainer in light and dark: a bright sand page and near-black text were rejected as glaring, a bright rose fill on dark was rejected as too strong, and a soft charcoal dark mode was chosen.

## Decision

The theme uses one accent, a dusty desert rose, on a muted sand page (light) or a charcoal page (dark). Text is soft brown on light and soft grey on dark, never pure black or white. The logo keeps its own bronze palette; the theme does not use bronze.

| Token | Light | Dark |
| --- | --- | --- |
| canvas | `#E9E1D6` | `#262425` |
| surface | `#EFE8DE` | `#2D2A2B` |
| text | `#3B3330` | `#B9B2B0` |
| heading | `#3B3330` | `#CAC4C2` |
| muted | `#65574F` | `#9A9392` |
| line | `#C9B8AD` | `#443F40` |
| rose (text, links) | `#7A4F4F` | `#B58D90` |
| rose fill (buttons) | `#7A4F4F`, text `#F6EFE8` | `#7A5558`, text `#EFE8E8` |

Measured contrast (WCAG 2.x): light text 9.5:1, muted 5.4:1, rose 5.3:1, button 6.0:1; dark text 7.4:1, heading 9.0:1, rose 5.3:1. Every text pair must stay at 4.5:1 or more; a test enforces this (task `theme.contrast`).

The values live in `tokens/theme.tokens.json`; the CSS is generated from it.

## Consequences

- The ADR 0005 family rule (each product has its own color) now applies to the logo only; desert rose is also Seaworthy's brand color, so a Slipway site shown beside Seaworthy output shares a hue. The theme's rose is duller and sits on sand, which keeps the two apart; a user can change the accent in `_config.yml`.
- Dark mode is deliberately low in contrast (text about 7:1). A site that needs more can raise the text token.
