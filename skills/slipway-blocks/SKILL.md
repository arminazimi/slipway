---
name: slipway-blocks
description: Choose a Slipway component for a page, write its Markdown directive with the options it reads, then check that the build reports no new diagnostic.
metadata:
  version: "0.3.0"
---

# Insert a component

A component is one styled piece of a page that the theme ships: a callout, a badge, a collapsible section, numbered steps, a file tree. You write a Markdown directive; the engine turns it into a `<sl-component>` element and the theme renders it. If the site has an `AGENTS.md`, read it first and follow it.

Use a component only when a page needs one of these shapes. For prose, a plain list, or a quotation, plain Markdown is lighter.

## 1. Take a baseline

Get the theme once, into a folder outside the site, and build the site before you change it. Keep the diagnostics the build prints. Your edit is done when it adds no diagnostic.

```sh
git clone --depth 1 https://github.com/arminazimi/slipway "$HOME/.slipway"
cd "$HOME/.slipway" && npm ci && cd -
```

## 2. Choose the component

| Component | Use it for | Directive form | Options |
| --- | --- | --- | --- |
| callout | A note, tip, important point, warning, or caution | `:::callout{…}` … `:::`, or `> [!KIND]` | `type`, `title` |
| badge | A short status label on its own line | `::badge{…}` (leaf only) | `label`, `variant` |
| details | Text the reader can expand | `:::details{…}` … `:::` | `summary`, `open` |
| steps | A numbered sequence or tutorial | `:::steps` … `:::`, body is an ordered list | none |
| file-tree | A folder structure with a note per entry | `:::file-tree{…}` … `:::`, body is a nested list | `label` |
| table | Tabular data | GFM pipe table, no directive | none |
| cards | Not usable yet, see section 3 | none | none |

If no row fits, write a Markdown list, table, or quote.

## 3. Write each component

The names above are the folder names under `packages/theme/components/`. The engine keys a directive by its name, so `:::callout` reaches the `callout` folder and nothing else. A directive name that is not a component folder renders its body as plain content and prints a `render.unknown-component` warning.

### callout

```markdown
:::callout{type=warning title="Back up first"}
Run the migration on a copy of the database.
:::
```

- `type`: `note` (the default), `tip`, `important`, `warning`, or `caution`. `danger` is read as `caution`. Any other value, or none, is a note.
- `title`: replaces the kind's default title (Note, Tip, Important, Warning, Caution). Quote it when it has spaces.
- The body is Markdown.
- The GitHub alert form renders the same component and takes no options: `> [!TIP]` on the first line of a blockquote, then the body.

### badge

```markdown
::badge{label="New" variant=tip}
```

- Leaf directive only: two colons and no body. It is block-level, so it takes its own line.
- `label`: the text shown. Without a body, the badge shows only this text.
- `variant`: `note` (the default), `tip`, `important`, `warning`, or `caution`. An unknown value is a note.
- The inline form `:badge[New]{variant=tip}` does not render a badge: the engine turns it into a `<div>` with the text. Never write it.

### details

```markdown
:::details{summary="Install on Windows" open}
Run the installer, then restart the terminal.
:::
```

- `summary`: the text of the disclosure control. Without it, the summary is `Details`.
- `open`: write it as a bare word. Its presence, with any value, starts the block expanded. Leave it out for a collapsed block.
- The body is Markdown. The element is native `<details>`, so it works without JavaScript.

### steps

```markdown
:::steps
1. Install the package.
2. Add a `slipway.yml`.
3. Run the build.
:::
```

- The body must be an ordered list; each item is one step. The numbers come from CSS for the page's language.
- The directive takes no options.

### file-tree

```markdown
:::file-tree{label="Project layout"}
- src/ # source code
  - **index.ts** # entry point
- README.md
:::
```

- `label`: the accessible name of the tree. Without it, the name is `File tree`.
- The body is a nested bullet list.
- A name ending in `/` is a folder; an entry with nested items is a folder too.
- Text after ` # ` (a space before and after the `#`) is a muted note.
- A name in bold (`**name**`) or inside `<mark>` is highlighted.

### table

Write a GFM pipe table. There is no directive. The theme's table component can wrap a table in a scroll region, but the engine does not apply that wrapper yet, so keep tables narrow.

```markdown
| Option | Default |
| --- | --- |
| `label` | `File tree` |
```

### cards: do not use

`cards` is not usable from Markdown yet. Its default export reads `children`, which the render host never passes, so `:::cards` renders an empty grid and drops its list. The `card` helper in the same folder has no directive. Use a Markdown list of links until the component is fixed.

## 4. Insert it

1. A container directive (`:::`) opens and closes on its own lines, and the closing `:::` must match the opening one.
2. Attribute values with spaces are quoted: `title="Back up first"`. Unquoted words are fine: `type=tip`.
3. Put a block directive on its own line, with a blank line before and after, and never inside a list item or a table cell.
4. Never write the `<sl-component>` element by hand; the engine emits it from the directive.
5. Never add `dir="rtl"`, physical CSS, or a script for a component. The theme handles direction, and every component reads without JavaScript.

A page with a callout, a steps list, and a file tree:

```markdown
---
title: Set up a project
description: Create a site and see its files.
---

## Before you start

:::callout{type=tip title="Check the version first"}
The engine needs Node 24 or later.
:::

## Steps

:::steps
1. Create the folder.
2. Add the `slipway.yml` file.
:::

## Files

:::file-tree{label="Site layout"}
- content/ # pages and posts
  - **index.md** # home page
- slipway.yml # site settings
:::
```

## 5. Check the page

Build the site with the engine, then read the diagnostics it prints. Each one names a file and line; fix it there and build again. The diagnostics that matter for components are:

- `render.unknown-component`: the directive name is not a component folder. Fix the name, or use a component from section 2.
- `render.bad-props`: the `data-props` attribute is not a JSON object. Check the attributes on the directive.
- `render.unclosed-component`: a container directive has no closing `:::`.

The build must add none of these to your baseline. Then open the page in both light and dark mode and check the component looks right.

## Never

- Never invent a directive name or an option. Use only the names in section 2.
- Never use the inline `:badge[…]` form.
- Never use `:::cards` or a `card` directive; use a list of links.
- Never write `<sl-component>` by hand.
- Never edit `packages/theme/components/` to make one page work; choose another component or change the content.
- Never add `dir="rtl"`, physical CSS, or a script for a component.
