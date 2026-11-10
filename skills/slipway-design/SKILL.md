---
name: slipway-design
description: Restyle a Slipway site with design tokens and a preset, add CSS through the override slots, and keep light and dark contrast passing.
metadata:
  version: "0.3.0"
---

# Restyle a Slipway site

A Slipway site's look comes from the theme's design tokens and your own stylesheet, never from edited theme files. A restyle changes token values; the token names stay public across releases. If the site has an `AGENTS.md`, read it first; it wins where it differs.

## Token names in the engine theme

The engine theme (`packages/theme`) defines its tokens in `packages/theme/tokens/`. `names.json` is the registry: it freezes the token names, grouped as `color`, `type`, `space`, `radius`, `shadow`, `state`, `code`, and `motion`, with a placeholder value for each. Every other `tokens/<group>.json` file sets the values of its group, such as `motion.json` for the motion durations and easings; a name missing from `names.json` is an error. `npm run tokens` in `packages/theme` writes `styles/tokens.css` from these files. That file is generated; do not edit it by hand.

Each token is a CSS custom property named `--<group>-<name>`:

| Group | Examples |
| --- | --- |
| color | `--color-canvas`, `--color-text`, `--color-heading`, `--color-muted`, `--color-border`, `--color-accent`, `--color-link`, `--color-focus`, `--color-success`, `--color-warning`, `--color-danger`, `--color-info` |
| type | `--type-font-body`, `--type-size-base`, `--type-leading-body`, `--type-weight-bold` |
| space | `--space-1`, `--space-2`, `--space-4`, `--space-8` |
| radius | `--radius-sm`, `--radius-md`, `--radius-full` |
| shadow | `--shadow-sm`, `--shadow-md` |
| state | `--state-hover-bg`, `--state-selected-bg`, `--state-focus-ring` |
| code | `--code-bg`, `--code-fg`, `--code-border` |
| motion | `--motion-fast`, `--motion-base`, `--motion-ease` |

A color token has a light and a dark value. The dark value is set in `$extensions.lateen.dark` in `names.json`, and `tokens.css` joins the two with `light-dark()`, so one name works in both modes. Component CSS reads only these names; the component tests fail on a name that is not a token. Write your own CSS with the same names.

## 1. Take a baseline

Build the site and run the doctor before you change anything, and keep the output: the restyle is done when it adds no finding and no failed contrast pair.

```sh
npx slipway build
npx slipway doctor . --build dist
```

## 2. Choose the values

Change a group of tokens as a whole, not one at a time, or the result drifts:

- **Type.** `--type-font-body` for reading, `--type-font-heading` for headings. Name a family the page loads, or a system stack: a family the page does not load falls back silently.
- **Color.** One accent and a canvas and text pair, each with a light and a dark value.
- **Shape.** `--radius-sm`, `--radius-md`, `--radius-full`.
- **Space and motion.** `--space-*` and `--motion-*`.

Every name is in `packages/theme/tokens/names.json`.

## 3. Override the tokens

Put your values in a stylesheet your site links after the theme's, for example `site.css`. Colors use `light-dark()` so one name works in both modes:

```css
:root {
  --color-accent: light-dark(#4a5c2f, #b9c69b);
  --color-link: light-dark(#3d4d27, #c5d1a8);
  --radius-md: 0.5rem;
}
```

Link the stylesheet from a theme option or the layout your site uses. The engine theme reads only token names, so a restyle needs no change to theme files.

## 4. Check the contrast

Check every pair in both modes:

- `--color-text`, `--color-heading`, `--color-muted`, and `--color-link`, each on `--color-canvas`: at least 4.5:1.
- Large text and interface marks: at least 3:1.

The ratio is `(lighter + 0.05) / (darker + 0.05)` on WCAG relative luminance; `contrastRatio` in `tools/theme/contrast.ts` is the function the theme's check uses. A palette that changes `--color-canvas`, `--color-text`, `--color-heading`, `--color-muted`, or `--color-border` must change and re-check all of them together.

## 5. Write RTL-safe CSS

Use logical CSS properties so right-to-left works: `margin-inline-start`, `padding-inline`, `border-inline-start`, `max-inline-size`, never `left`, `right`, or `width` alone. Every page must read without JavaScript: add `defer` to any script.

## 6. Check the restyle

```sh
npx slipway build
npx slipway doctor . --build dist
```

Each problem is printed as `file:line key: message`. Fix it at that line and run it again. The doctor must keep the level and finding count of your baseline; a finding that names your file is yours to fix. Look at one page in both modes: the theme toggle and the system setting each have to work.

## Never

- Never edit or copy the theme's layouts or components, or `styles/tokens.css`; override tokens.
- Never give a changed color one value for both modes; set it with `light-dark()` and check both.
- Never name a font family the page does not load; it falls back silently.
- Never add a script that blocks rendering, or a control that shows without JavaScript.
- Never lower the doctor's `level`, drop `--build`, or edit a built folder to make a check pass.
- Never hard-code a color, space, radius, or duration in an engine component's CSS; read a token name from the table above.
