# AGENTS.md

How to edit this site. It is an mdBook site; you edit Markdown under `src/` and the settings in `book.toml`. Read this file before every task.

## Layout

- `book.toml`: site settings (title, language, source folder, and the Slipway preprocessor and renderer).
- `src/SUMMARY.md`: the table of contents. Every page is listed here, and the sidebar takes its titles from the links.
- `src/`: the pages. Each page has a title in its front matter or a leading `# Title` heading; its address follows its path, so a page at `src/<section>/<slug>.md` is served at `/<section>/<slug>.html`.
- `book/html/`: the built site. mdBook writes it on every build; never edit it.
- `content-schemas.json`: which JSON Schema checks `book.toml` (`schema/book-config.schema.json`) and each page (`schema/page.schema.json`).

## Add a page

1. Create `src/<slug>.md`:

   ```markdown
   ---
   title: About us
   description: Who we are, in one sentence.
   ---

   # About us

   Plain Markdown here.
   ```

   Use only the front matter keys in `schema/page.schema.json`. The adapter strips the front matter
   before mdBook renders the page, so it never shows as text.

2. List it in `src/SUMMARY.md`:

   ```markdown
   - [About us](<slug>.md)
   ```

A file that `src/SUMMARY.md` does not list is not built.

## Check your edit

```sh
mdbook build
npx slipway doctor . --build book/html
```

The second command checks the site against the agent-editable spec. Fix every error before you finish.

## Never

- Never edit `book/html/`; your change is lost on the next build.
- Never add a Markdown file to `src/` without listing it in `src/SUMMARY.md`: mdBook does not build it, and the site has no page to link.
- Never remove `[preprocessor.slipway]` or `[output.slipway]` from `book.toml`: they write `book/html/sourcemap.json`, the Markdown copy of each page, and `data-source` on every heading.
- Never write a heading inside a blockquote or a list item and expect a source map entry; the adapter maps headings that start a line.
