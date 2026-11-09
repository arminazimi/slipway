# Design decisions: mockup approval

Status: approved (issue #1087). Reviewed: `home.html` (#1083), `guide.html` (#1084), `api.html` (#1085), `mobile.html` (#1086) in `docs/design/mockups/`, against `docs/design/brief.md` and its reference sites.

The token tasks (#1089, #1090 and the rest) use the values below. Where this file and the brief differ, this file wins.

## Review method

Each mockup was checked against the brief by reading its CSS: every hex color, font stack, width, radius, breakpoint, theme and `dir` variant. Layout at 375, 1024, and 1440 px follows from the breakpoints (below 48 rem the sidebar is a drawer, below 64 rem the on-this-page column folds, from 64 rem the three-column grid applies, capped at 90 rem).

## Approved

### Color

All colors in the four mockups match the brief's night (Kanagawa) and day (Nord) tables exactly. No value was changed. Approved as written in the brief:

- Night: bg `#1f1f28`, surface `#2a2a37`, overlay `#363646`, highlight `#54546d`, muted `#727169`, subtle `#c8c093`, text `#dcd7ba`, accent `#7e9cd8`, accent-text `#7fb4ca`.
- Day: bg `#eceff4`, surface `#e5e9f0`, overlay `#d8dee9`, highlight `#c5cddc`, muted `#8892a6`, subtle `#4c566a`, text `#2e3440`, accent `#5e81ac`, accent-text `#4c6f9a`.
- Syntax hues: night keyword `#957fb8`, function `#7e9cd8`, string `#98bb6c`, number `#ffa066`, type `#7aa89f`, variable `#e6c384`; day keyword `#5e81ac`, function `#3f7f8c`, string `#6c8a52`, number `#94638a`, type `#4f8a88`, variable `#b07d2b`.
- Text on a filled accent: `bg` in night, white (`#ffffff`) in day.
- Default mode is night. Borders are `highlight` mixed 55% into `bg`.

Still open for the token tasks: the brief allows #1089 and #1090 to adjust values that fail WCAG 2.2 AA contrast. Any such change is recorded in the token task, not here.

### Fonts

- Body and UI: Geist. Code: Geist Mono (ligatures off). Persian and Arabic: Vazirmatn.
- Right-to-left pages use the stack Vazirmatn, then Geist, then system sans, with code in Geist Mono. Confirmed on mixed lines in `mobile.html` and the right-to-left views.
- Base 16 px, line height 1.65, scale 1.2. Page title 2rem. Code at 0.875em.

### Widths and shape

- Sidebar 17 rem (`--side-w`), article 46 rem max, on this page 14 rem (`--toc-w`), page max 90 rem, header 3.5 rem.
- Breakpoints: 64 rem (on this page folds) and 48 rem (sidebar becomes a drawer).
- Radius 6 px for controls (`--r-ctl`), 10 px for code blocks and cards (`--r-card`). 4 px spacing base.

### Coverage

Each mockup shows night, day, and right-to-left. The command palette is shown in home, guide, api and mobile (full width). The hover popover is shown in the desktop mockups; `mobile.html` omits it on purpose (no hover on touch) and opens symbols on tap.

## Change requests

1. **Mobile page backdrop.** `mobile.html` uses `#16161d` for the page around the frames. It is not a theme color. It is mockup staging only and must not become a token.
2. **Mobile symbol tap.** The tap behavior replaces the hover popover on touch. The layout task for hoverable symbols (#1094 onward) must implement both.
3. **Logical properties.** No physical `left`/`right` margin, padding or border properties were found in the mockups. Keep it that way in the token and layout tasks.

## Limits of this review

This review compared the mockups' source with the brief. Rendering them in a browser at 375, 1024 and 1440 px and a side-by-side look at the reference sites was not done here; a maintainer who sees a visual problem should open a follow-up issue.
