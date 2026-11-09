# Components

A component is a piece of content or interface that pages use: a callout, a card, a code tab, an endpoint, and similar. This page is for theme contributors. The rules for units are in [ADR 0023](adr/0023-engine-theme-boundary.md); the folder guide is [packages/theme/components/README.md](../packages/theme/components/README.md).

## File layout

One folder per component: `packages/theme/components/<name>/`, with a lowercase kebab-case name (`file-tree`, not `fileTree`).

| File | Required | Purpose |
| --- | --- | --- |
| `index.ts` | yes | The Preact component, written with `h()`. Its default export is the component. |
| `style.css` | only when it has styles | The component's own CSS. |
| `client.ts` | only when it needs the browser | Its island: a plain ES module that ships only on pages that use the component ([ADR 0022](adr/0022-engine.md), rule 3). |
| `*.test.ts` | yes | Tests for what a reader or agent can observe, run by `node --test`. |

The registry finds components by their folder. Adding a component never edits a shared index file.

## Rules

- **TypeScript only.** Write `index.ts` with `h()`. There is no JSX and no `.tsx` file.
- **Readable without JavaScript.** A page must read and navigate with scripts off. An island enhances the page; any control it enhances starts `hidden`.
- **Logical CSS.** Use `margin-inline-start`, `padding-inline`, and `border-inline-start`, never `margin-left` or `left`, so right-to-left pages work.
- **Tokens, not raw values.** Use the theme's tokens (`var(--…)`) for colors, spacing, and type.
- **Class names follow the component.** The root class is the component name (`callout`), and its parts add a suffix (`callout-title`, `callout-body`).
- **The engine knows nothing about the component.** Components live in the theme. Nothing in `packages/engine/` may import from `packages/theme/` or name a component.

## Tests

Test the component's contract: its root element, each variant, escaping of its input, and the source position it carries. Run the theme's tests with `npm test --workspace @velella/lateen`, or everything with `npm run check`.
