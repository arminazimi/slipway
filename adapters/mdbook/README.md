# Slipway adapter for mdBook

An mdBook preprocessor and renderer that make an mdBook site [agent-editable](../../spec/agent-editable/0.1.md) up to level L2. It writes:

- `/sourcemap.json` ([format v0](../../spec/sourcemap/v0.md)): every chapter with its source file, its headings, and its inline links, each at its line in the source file.
- a Markdown twin of every chapter at the chapter's path with `.md` instead of `.html` (`/guide/install.md` for `/guide/install.html`): the chapter's Markdown as written but without front matter, under its title as a heading unless it starts with one. Each page links its twin from `<head>`.
- `data-source="<source>:<line>"` on every heading, so an edit prompt can name the line (`ae.edit-prompt.source`).

`AGENTS.md` and the content schemas live in the site's source folder, which an adapter should not write, so it ships them in [`starter/`](starter/) for the site to copy: `AGENTS.md`, `content-schemas.json`, a `book.toml` with the two tables to merge, and the schemas for `book.toml` and page front matter. Edit the starter to match the site; `slipway doctor` checks it stays true.

It needs mdBook 0.5 or later and Node 18 or later. It writes nothing for L3 (the agent-skills index).

## Use it

1. Put this folder in the site, for example at `tools/slipway-mdbook/`, or install it from that path with npm. The two commands in `book.toml` are paths, so no `PATH` change is needed.
2. Merge [`starter/book.toml`](starter/book.toml) into the site's `book.toml`, keeping its own `[book]`, `[build]`, and `[output.html]` tables:

   ```toml
   [preprocessor.slipway]
   command = "node tools/slipway-mdbook/src/preprocess.mjs"

   [output.slipway]
   command = "node tools/slipway-mdbook/src/render.mjs"
   ```

   The second table adds a renderer, and mdBook 0.5 gives every renderer its own folder when there is more than one: the HTML moves from `book/` to `book/html/`, and the Slipway renderer's own folder, `book/slipway/`, stays empty. **Deploy `book/html/`.**

3. Copy everything in [`starter/`](starter/) to the site root and adapt it. Keep the site's `book.toml`; merge the two tables from the starter's instead of replacing the file.
4. Build and check:

   ```sh
   mdbook build
   node packages/doctor/bin/slipway.mjs doctor <site> --build <site>/book/html
   ```

## How it works

- The preprocessor (`src/preprocess.mjs`) runs for the HTML renderer. It removes a chapter's YAML or TOML front matter, which mdBook would otherwise render as page text, and puts an HTML comment marker, `<!-- slipway:12 -->`, before every heading that starts a line in its own source file, with the heading's line. mdBook renders the marker as an HTML comment before the heading, so the heading keeps mdBook's own id, anchor link, and inline formatting.
- The renderer (`src/render.mjs`) runs after the HTML renderer. It reads every chapter's built HTML, turns each marker into `data-source` on the heading after it, removes the markers (also from `print.html`), and writes the map and the twins. It finds the HTML folder as its own destination on mdBook 0.4 layouts, or the `html` folder beside it on mdBook 0.5.
- Sections come from the built HTML, so their `id` is the one the page has and their text is the text the page shows, with mdBook's `#` link and any inline markup removed. Links are read from the source file.
- A chapter's `url` is its file with `.html`, as mdBook links it: `/guide/install.html`, `/index.html`.

## How lines are found

mdBook expands `{{#include}}` before a preprocessor sees a chapter, so the preprocessor reads the chapter's source file and matches the expanded chapter's headings to it in order. A heading that came from an included file is left unmarked: it belongs to the included file, not to this page, and gets no section. Lines count from the top of the source file, so a page with front matter gets the line numbers it has in the editor.

Headings are ATX (`## Title`) and setext (a line underlined with `=` or `-`) lines outside fenced code blocks. Links are inline links, `[text](href)`, outside code. Images, reference-style links, autolinks, and links inside includes are left out.

## Limits

- Headings inside blockquotes or list items get no `data-source` and no section: the preprocessor inserts markers at the start of a line.
- A heading that a preprocessor other than Slipway adds after Slipway's runs gets no section.
- Tested with one language. A multilingual book needs one build per language.
- mdBook 0.4 writes the HTML to `book/`; the starter and the test target 0.5, where a second renderer moves it to `book/html/`.
- `slipway doctor` does not read TOML yet, so it does not check `book.toml` against its schema.
- The Markdown twin of a chapter that uses `{{#include}}` keeps the directive as written.

## Tests

`test/mdbook.test.mjs` copies `test/site/` and `starter/` into a temporary folder, builds it, and checks the output with `slipway doctor` (level L2, no errors) and directly. The build tests need mdBook 0.5 or later on the `PATH` or `MDBOOK` set, and skip otherwise. The helper tests for headings, links, markers, twins, and addresses run everywhere.
