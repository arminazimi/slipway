# Slipway adapter for Quarto

A Quarto project extension that makes a Quarto website [agent-editable](../../spec/agent-editable/0.1.md) up to level L2. It writes:

- `/sourcemap.json` ([format v0](../../spec/sourcemap/v0.md)): every page with a source file, its headings, and its inline links, each at its line in the source file, front matter included.
- a Markdown twin of every page at its own address with `.md` instead of `.html` (`/docs/intro.md`, `/index.md`): the title as a heading when the body does not start with one, then the page's Markdown as written, without front matter. The post-render step links it from the page's `<head>`.
- `data-source="<source>:<line>"` on every heading, through a Lua filter, so an edit prompt can name the line (`ae.edit-prompt.source`).

`AGENTS.md` and the content schemas live in the site's source folder, which an extension cannot write, so the adapter ships them in [`starter/`](starter/) for the site to copy: `AGENTS.md`, `content-schemas.json`, and `schema/` with schemas for `_quarto.yml` and for front matter. Edit them to match the site; `slipway doctor` checks they stay true.

It needs Quarto 1.4 or later and Node on the machine for the post-render step. It writes nothing for L3 (the agent-skills index).

## Use it

1. Copy this folder's `_extensions/slipway/` into the site root, so the extension is at `_extensions/slipway/`.
2. Copy everything in [`starter/`](starter/) to the site root and adapt it: the `_quarto.yml` render list, title, and description.
3. Check that `_quarto.yml` has the extension, the post-render step, and headings without section wrappers:

   ```yaml
   project:
     post-render: node _extensions/slipway/post-render.mjs

   format:
     html:
       section-divs: false

   filters:
     - slipway
   ```

   `project.post-render` is your own command; put the two lines together with any command the site already runs. The script takes the project folder from its working directory and the output folder from `QUARTO_PROJECT_OUTPUT_DIR`, both set by Quarto.

   Pandoc's default writes each heading's id on a `<section>` wrapper, leaving the heading itself without one. The source map names a section by the heading's id, so the starter turns the wrappers off. With the default, the map has empty `sections` arrays and `slipway doctor` cannot check heading lines.

4. Build and check:

   ```sh
   quarto render
   node packages/doctor/bin/slipway.mjs doctor . --build _site
   ```

Quarto writes the site to `_site` because that is what `starter/_quarto.yml` sets. On an existing site with another output folder, change the `--build` argument.

## How lines are found

Quarto does not tell a filter where a heading sits in its file, so the Lua filter reads the page's source file (`quarto.doc.input_file`) and finds its headings itself:

- Headings are ATX (`## Title`) and setext (a line underlined with `=` or `-`) lines outside front matter and fenced code blocks. Headings are matched in document order: the filter takes the first unused line of the same level whose letters and digits contain the rendered heading's, so a repeated title gets its own line.
- Links are inline links, `[text](href)`, outside front matter, fenced code, and code spans. Images, reference-style links (`[text][ref]`), autolinks, and links inside includes are left out.

A heading that comes from an include, a shortcode, or a template, not from a Markdown line, gets no `data-source` and no section.

## Limits

- Pages outside the project's `render` list have no built HTML and are left out of the map, as are drafts.
- Content included from another file is left out of the map: its lines are not in the page's source file.
- The twin link is added only when the built page has a `</head>` that the post-render step can find.
- Tested with one language. A multilingual site writes one map with every page, in URL order.
- The site's `_quarto.yml` may use keys the starter schema does not list. Add them to `schema/quarto-config.schema.json` with a description, as the AGENTS.md says.

## Tests

`test/quarto.test.mjs` copies `test/site/` and `starter/` into a temporary folder, builds it, and checks the output with `slipway doctor` (level L2, no errors) and directly. The build tests need `quarto` on the `PATH` or `QUARTO` set, and skip otherwise; CI does not install Quarto, so they skip there. The helper and post-render tests run with Node alone.

```sh
node --test adapters/quarto/test/quarto.test.mjs
```
