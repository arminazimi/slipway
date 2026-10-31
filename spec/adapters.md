# Adapters

An adapter makes an existing static site generator produce what the [agent-editable site spec](0.1/0.1.html) asks for, so a site can be edited by an agent without moving to Slipway. Every adapter in this repository:

- writes `/sourcemap.json` in the output folder ([format v0](https://github.com/arminazimi/slipway/blob/main/spec/sourcemap/v0.md)): every content page, its headings, and its inline links, each at its line in the source file;
- writes a Markdown twin of every content page and links it from `<head>`;
- adds `data-source="<source>:<line>"` to every heading, so an edit prompt can name the line;
- ships a `starter/` folder with `AGENTS.md`, `content-schemas.json`, and `schema/` files for the site to copy and adapt.

The tests build a fixture site with each adapter and its starter files, then run `slipway doctor` on the output. Each adapter reaches L2 with no errors. None writes the L3 agent-skills index.

Each adapter name links to its folder on GitHub.

| Adapter | Form | Emits | Needs |
| --- | --- | --- | --- |
| [Docusaurus](https://github.com/arminazimi/slipway/tree/main/adapters/docusaurus) | Docusaurus plugin and a remark plugin | `sourcemap.json`, Markdown twins, `data-source` on headings | Docusaurus 3; Node.js 18 or later |
| [Eleventy](https://github.com/arminazimi/slipway/tree/main/adapters/eleventy) | Eleventy plugin | `sourcemap.json`, Markdown twins, `data-source` on headings | Eleventy 3; Node.js 18 or later |
| [Hugo](https://github.com/arminazimi/slipway/tree/main/adapters/hugo) | Hugo module | `sourcemap.json`, Markdown twins, `data-source` on headings | Hugo 0.123 or later |
| [MkDocs](https://github.com/arminazimi/slipway/tree/main/adapters/mkdocs) | MkDocs plugin | `sourcemap.json`, Markdown twins, `data-source` on headings | MkDocs 1.5 or later; Beautiful Soup 4.12 or later |
| [Quarto](https://github.com/arminazimi/slipway/tree/main/adapters/quarto) | Quarto project extension (Lua filter and post-render script) | `sourcemap.json`, Markdown twins, `data-source` on headings | Quarto 1.4 or later; Node.js 22 or later |
| [Zola](https://github.com/arminazimi/slipway/tree/main/adapters/zola) | Node.js script run after `zola build` | `sourcemap.json`, Markdown twins, `data-source` on headings | Zola; no minimum version is pinned |

## Add an adapter by pull request

Adapters are added by pull request: one folder per generator under `adapters/`. There is no separate registry or submission form. The pull request is the review, and it adds the adapter's row to the table above.

An adapter pull request has:

- **Adapter code.** It writes `sourcemap.json`, a Markdown twin of each content page linked from `<head>`, and `data-source="<source>:<line>"` on each heading, following the generator's content model. It writes the output folder; the site copies the starter files.
- **A `starter/` folder** with `AGENTS.md`, `content-schemas.json`, and `schema/` files for the generator's configuration and front matter, which the site copies and adapts. `slipway doctor` checks that they match the site.
- **A test** at `adapters/<name>/test/<name>.test.mjs`. It copies `test/site/` and `starter/` into a temporary folder, builds the site with the generator, and runs `slipway doctor` on the output. The fixture must reach L2 with no errors. Like the other adapter tests, it skips with a message when the generator is not installed; `npm run check` runs it with the rest.
- **The table row** above, in the same pull request. Add the adapter name, form, artifacts, generator version, and GitHub link.

An adapter implements the spec as written. A change to the spec itself goes through the [RFC process](https://github.com/arminazimi/slipway/blob/main/spec/PROCESS.md). For the branch, commit, and test rules, see [CONTRIBUTING.md](https://github.com/arminazimi/slipway/blob/main/CONTRIBUTING.md).
