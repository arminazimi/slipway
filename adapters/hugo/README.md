# Slipway adapter for Hugo

A Hugo module that makes a Hugo site [agent-editable](../../spec/agent-editable/0.1.md) up to level L2. It writes:

- `/sourcemap.json` ([format v0](../../spec/sourcemap/v0.md)): every page with a source file, its headings, and its inline links, each at its line in the source file, front matter included.
- a Markdown twin of every page at `<page>/index.md`: the title as a heading, then the page's Markdown as written, without front matter. `partial "slipway/head.html"` links it from `<head>`.
- `data-source="<source>:<line>"` on every heading, through a heading render hook, so an edit prompt can name the line (`ae.edit-prompt.source`).

`AGENTS.md` and the content schemas live in the site's source folder, which a module cannot write, so the module ships them in [`starter/`](starter/) for the site to copy: `AGENTS.md`, `content-schemas.json`, and `schema/` with schemas for `hugo.toml` and for front matter. Edit them to match the site; `slipway doctor` checks they stay true.

It needs Hugo 0.123 or later. It writes nothing for L3 (the agent-skills index).

## Use it

1. Import the module and turn on its output formats in `hugo.toml`. Hugo does not merge `outputs` from a module, so the site lists them itself:

   ```toml
   [[module.imports]]
   path = "github.com/arminazimi/slipway/adapters/hugo"

   [outputs]
   home = ["html", "rss", "markdown", "sourcemap"]
   page = ["html", "markdown"]
   section = ["html", "rss", "markdown"]
   ```

   Importing a module by path needs `hugo mod init` once, and Go on the machine. Without Go, copy this folder into `themes/slipway-hugo/` and put `"slipway-hugo"` first in `theme` instead.

2. Copy everything in [`starter/`](starter/) to the site root and adapt it.
3. Add `{{ partial "slipway/head.html" . }}` inside your theme's `<head>`.
4. Build and check:

   ```sh
   hugo
   node packages/doctor/bin/slipway.mjs doctor <site> --build <site>/public
   ```

## How lines are found

Hugo does not tell templates where a heading or link sits in its file, so the module reads the source file (`os.ReadFile`) and finds them itself:

- Headings are ATX (`## Title`) and setext (a line underlined with `=` or `-`) lines outside front matter and fenced code blocks. The render hook takes the first such line of the same level whose letters and digits contain the rendered heading's, and that no earlier heading on the page has taken, so a repeated title gets its own line.
- Links are inline links, `[text](href)`, outside code. Images, reference-style links (`[text][ref]`), autolinks, and links inside shortcodes are left out.

A heading that comes from a shortcode or a template, not from a Markdown line, gets no `data-source` and no section.

## Limits

- Content mounted from another module is left out of the map: its file is not in the site's source folder.
- Tested with one language. On a multilingual site, each language's home writes its own `sourcemap.json` with that language's pages.
- A theme that has its own `layouts/_default/_markup/render-heading.html` replaces the module's; copy the `data-source` attribute and the `Store` line into it.
- `slipway doctor` does not read TOML yet, so it does not check TOML front matter or `hugo.toml` against their schemas, and reports a page with TOML front matter as matching no schema. YAML front matter is fully checked.

## Tests

`test/hugo.test.mjs` copies `test/site/` and `starter/` into a temporary folder, builds it, and checks the output with `slipway doctor` (level L2, no errors) and directly. It needs `hugo` on the `PATH` or `HUGO` set, and skips otherwise; CI installs Hugo.
