# 0016. Diagrams: render at build time where the mode allows, keep the source everywhere

**Status:** Accepted (2026-10-30).

## Context

Docs need diagrams — flowcharts, sequence diagrams, architecture sketches — but a Slipway site may run in classic Pages, also known as GitHub Pages' safe mode, where no plugin runs, or in Actions mode, where the site's own `_plugins/` do. The two modes therefore cannot share one rendering path.

Three more constraints apply. A page must read without JavaScript, so a diagram cannot depend on a browser library to appear. The theme's scripts stay under 10 KB in total and none of that budget may go to rendering pictures that a build can produce. And an agent reading a page needs the diagram's source and a text alternative, not only the SVG: Markdown twins ([ADR 0006](0006-markdown-twins.md)) and `llms-full.txt` carry text.

Two source formats cover the common needs: Mermaid, which reads a text syntax and renders flowcharts, sequence diagrams, and the like, and D2, which reads a similar text syntax with a stronger layout engine. Both have command-line renderers (`mmdc` from Mermaid CLI, and `d2`). The decision is where each runs.

## Decision

1. **Classic Pages renders ahead of time.** `tools/diagrams/render.mjs` runs Mermaid CLI and D2 on the site's sources and writes SVGs to `assets/diagrams/`, which the site commits. A check fails when a diagram source changed or a picture is missing, so the output cannot go stale. The build itself stays plugin-free: the page points at a committed SVG with an `img`, and nothing runs at request time.
2. **Actions mode renders at build time.** A plugin, opt-in per site like the twins and social-image plugins, renders each diagram to inline SVG in `_plugins/`. Inline SVG inherits `currentColor` and the theme's tokens, so light, dark, and forced-colors modes need no second picture. The plugin never ships in the gem, because a theme cannot ship plugins.
3. **The source always survives.** The `diagram` include accepts a source format (`mermaid` or `d2`), the diagram text, a caption, and an alternative text. It prints the picture for readers and keeps the source in a `<details>` block for copying; the twins generator and `llms-full.txt` take the source as text plus the alternative text, never the SVG markup.
4. **No diagram script ships with the theme.** Client-side rendering is the fallback for a site that can neither commit pictures nor run a plugin. That site adds the renderer's own script itself, deferred, and pays its weight and its Content Security Policy allowance. The theme's budget and its default CSP are unchanged.
5. **Other generators render with their own hooks.** Hugo, Eleventy, Docusaurus, and the adapters have a build step, so they run the same two command-line tools from their own configuration and write the same `<figure>` markup and source contract. The spec, not Jekyll, defines what a page carries.
6. **Every diagram has a text alternative.** The include requires `alt` or a caption that serves as one, and the doctor warns when a diagram has neither. Color alone never carries meaning: edges and nodes are labelled.

## Consequences

- Page weight: a classic-Pages diagram costs one `img` and a cached SVG; an Actions diagram adds its SVG inline, so a very large diagram grows the HTML by its own size. A site with many diagrams renders them ahead of time in Actions only when it opts in.
- JavaScript: zero for diagrams by default in both supported modes, so the no-JS test passes without exceptions. The optional client-side path is outside the theme and is the site's choice.
- Classic Pages sites get a render step to run, on their machine or in their own CI; skipping it leaves a missing-image check failing rather than a broken build.
- Non-Latin labels shape correctly because rendering happens once, with the font stack the renderer embeds; right-to-left flowcharts set `direction: rtl` in the source or the D2 layout option.
- A renderer upgrade can change layout. The check compares the committed SVG's source hash, so regenerating is explicit, and a diagram's source — not its pixels — is the reviewed document.
