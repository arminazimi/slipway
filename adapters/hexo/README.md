# Slipway adapter for Hexo

A Hexo plugin that makes a Hexo site [agent-editable](../../spec/agent-editable/0.1.md) up to level L2. It writes:

- `/sourcemap.json` ([format v0](../../spec/sourcemap/v0.md)): every post and page built from a Markdown file, its headings, and its inline links, each at its line in the source file, front matter included.
- a Markdown twin of every such page at its address with `.md` (`/about/index.md` for `/about/`): the page's Markdown as written, without front matter, under its title as a heading unless it starts with one. Each page links its twin from `<head>`.
- `data-source="<source>:<line>"` on every Markdown heading, so an edit prompt can name the line (`ae.edit-prompt.source`).

`AGENTS.md` and the content schemas live in the site's source folder, which a plugin should not write, so the adapter ships them in [`starter/`](starter/) for the site to copy: `AGENTS.md`, `content-schemas.json`, and `schema/` with a schema for `_config.yml` and one for post and page front matter. Edit them to match the site; `slipway doctor` checks they stay true.

It has no dependencies of its own. It writes nothing for L3 (the agent-skills index).

## Use it

1. Copy [`src/index.js`](src/index.js) to the site's `scripts/slipway.js`. Hexo loads every file in `scripts/` before the build and runs the plugin with its own instance in scope, so nothing else is needed. (An `npm install hexo-slipway` would also be picked up, because Hexo loads dependencies whose names start with `hexo-`; the package is not published yet.)
2. Copy everything in [`starter/`](starter/) to the site root and adapt it.
3. Build and check:

   ```sh
   npx hexo generate
   node packages/doctor/bin/slipway.mjs doctor <site> --build <site>/public
   ```

## How it works

- `after_post_render` runs on each rendered post and page. It reads the file's Markdown headings, counting lines from the top of the file, and pairs them in order and by level with the `<h1>` to `<h6>` tags of the rendered content, adding `data-source` to each. Headings written as raw HTML, and headings inside fenced code, get none.
- `after_render:html` adds `<link rel="alternate" type="text/markdown" href="…">` to `<head>`, pointing at the page's twin under the site's `root`.
- `after_generate` runs once the routes are rendered and before Hexo writes them. It reads each post's and page's HTML from its route, takes the sections from the headings whose `data-source` names that page's own file, and reads the links from the source. Then it adds the twins and `/sourcemap.json` as routes, so Hexo writes them and `hexo clean` removes them like any other output.
- A page's `source` is its file from the site root, such as `source/_posts/hello.md`, and a page's `url` is its address with `index.html` dropped, so it resolves to a file in `public/`.
- Posts come from `source/_posts/`, whose address is set by `permalink`; pages come from any other Markdown file under `source/`, where `source/about/index.md` is served at `/about/`.

## Limits

- Only Markdown posts and pages are mapped. A page whose `layout` is `false` is mapped when Hexo still renders its content, but gets no twin link.
- Drafts (`source/_drafts/`) are not mapped unless Hexo builds them with `--draft`.
- Heading ids come from the Markdown renderer. A renderer that writes no ids leaves the page with no sections; `hexo-renderer-marked` writes them by default.
- A heading inside a Hexo tag (`{% … %}`) or written as HTML gets no `data-source`.
- Tested with one language and with `hexo-renderer-marked`; another renderer may order headings differently.

## Tests

`test/hexo.test.mjs` copies `test/site/` and `starter/` into a temporary folder, copies the plugin to `scripts/slipway.js`, builds it, and checks the output with `slipway doctor` (level L2, no errors) and directly. The build tests need `HEXO_MODULES` set to a `node_modules` folder that holds `hexo`, `hexo-renderer-ejs`, and `hexo-renderer-marked`, and skip otherwise. The other tests run everywhere.
