---
title: Components
description: Every component the Lateen theme provides, with its syntax, options, and a live example.
layout: doc
permalink: /components/
redirect_from:
  - /blocks/
  - /blocks/audio/
  - /blocks/chart/
  - /blocks/citation/
  - /blocks/compare/
  - /blocks/download/
  - /blocks/gallery/
  - /blocks/hero/
  - /blocks/logos/
  - /blocks/people/
  - /blocks/pricing/
  - /blocks/pull-quote/
  - /blocks/stats/
  - /blocks/testimonial/
  - /blocks/timeline/
---

Components are the pieces pages use inside their content: a callout, a code tab, an endpoint, a file tree. Each page below shows the Markdown you write, every option it reads, and a live example.

The engine turns a directive into the component whose folder has the same name under `packages/theme/components/`. A container directive (`:::name` … `:::`) wraps a Markdown body; a leaf directive (`::name`) stands alone on its own line. Directive attributes are the component's options: `:::callout{type=warning}`.

| Component | Use it for |
| --- | --- |
| [Badge](./badge/) | A short status label, such as a version or a beta marker. |
| [Callout](./callout/) | A note, tip, important point, warning, or caution. |
| [Cards](./cards/) | A responsive grid of linked cards, used by the home layout. |
| [Changelog entry](./changelog-entry/) | One release with a version, a date, and categories. |
| [Code](./code/) | Code highlighted at build time, with a copy button when JavaScript runs. |
| [Code tabs](./code-tabs/) | The same example in several languages or package managers, as tabs. |
| [Details](./details/) | A native disclosure that the reader can open and close. |
| [Diff block](./diff-block/) | Added, removed, and context lines, with a copy of the new file. |
| [Embed](./embed/) | A video or another page in a lazy iframe. |
| [Endpoint](./endpoint/) | An HTTP method, path, parameters, and body for API reference pages. |
| [Figure](./figure/) | An image with alt text, a caption, and a credit, in light and dark. |
| [File tree](./file-tree/) | A folder structure with a note per entry. |
| [Heading anchor](./heading-anchor/) | A link icon on every h2 to h4, added automatically. |
| [Kbd](./kbd/) | A keyboard key or key combination. |
| [Key-value list](./key-value/) | Properties, options, or metadata as a two-column list of keys and values. |
| [Mermaid](./mermaid/) | A Mermaid diagram rendered to inline SVG at build time, with its source kept. |
| [Output block](./output-block/) | The result of a command, apart from the command above it. |
| [Page status](./page-status/) | An experimental, beta, or deprecated banner from front matter. |
| [Schema table](./schema-table/) | A JSON Schema from `_data` as a table of properties. |
| [Steps](./steps/) | A numbered sequence or tutorial. |
| [Table](./table/) | Markdown tables in a labelled, keyboard-scrollable region. |
| [Tags](./tags/) | A wrapping list of tag chips, as links or plain text. |
| [Terminal](./terminal/) | A shell session with commands and their output. |
| [Version badge](./version-badge/) | A version badge that says when a feature was added, changed, or removed. |
| [Video](./video/) | A click-to-load video with a poster and a link that works without JavaScript. |

## Moving from the old blocks

The 0.2 theme had a larger set of blocks. Some became components; the rest have a lighter Markdown form or belong to a layout. Old URLs redirect to the page that replaces them.

| Old block | What to use now |
| --- | --- |
| Annotations, diff | [Code](./code/) |
| Audio | [Embed](./embed/) |
| Code group | [Code tabs](./code-tabs/) |
| Chart, compare, logos, pricing, stats | A [table](./table/) or a plain Markdown list. |
| Citation, download | A Markdown link. |
| Gallery | One [figure](./figure/) per image. |
| Hero | The [home layout](../../guides/) with `hero`, `actions`, and `sections` in front matter. |
| People, testimonial | A table, a blockquote, or a list. |
| Pull quote | A blockquote. |
| Timeline | An ordered list or [steps](./steps/). |
