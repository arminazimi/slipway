# Slipway adapter for VitePress

A VitePress plugin that makes a VitePress site [agent-editable](../../spec/agent-editable/0.1.md) up to level L2. It writes:

- `/sourcemap.json` ([format v0](../../spec/sourcemap/v0.md)): every Markdown page, its headings, and its inline links, each at its line in the source file, front matter included.
- a Markdown twin of every page at its address with `.md` (`/guide/setup.md` for `/guide/setup.html`, `/index.md` for `/`): the page's Markdown as written, without front matter, under its title as a heading unless it starts with one. Each page links its twin from `<head>`.
- `data-source="<source>:<line>"` on every Markdown heading, through a markdown-it plugin, so an edit prompt can name the line (`ae.edit-prompt.source`).

`AGENTS.md` and the content schemas live in the site's source folder, which a plugin should not write, so the adapter ships them in [`starter/`](starter/) for the site to copy: `AGENTS.md`, `content-schemas.json`, and `schema/front-matter.schema.json`. Edit them to match the site; `slipway doctor` checks they stay true.

It needs VitePress 1 and has no dependencies of its own. It writes nothing for L3 (the agent-skills index).

## Use it

1. Install it. It is not on npm yet, so copy this folder into the site (for example as `plugins/slipway-vitepress/`) and run `npm install ./plugins/slipway-vitepress`.
2. Add the build hook and the markdown plugin in `.vitepress/config.mts`:

   ```ts
   import { defineConfig } from "vitepress";
   import slipway, { sourcePlugin } from "slipway-vitepress";

   export default defineConfig({
     // ...
     // Keep the agent instructions out of the built site.
     srcExclude: ["AGENTS.md"],
     buildEnd: slipway,
     markdown: { config: (md) => md.use(sourcePlugin) },
   });
   ```

   If the config has its own `markdown.config`, call `sourcePlugin` from it. If it has its own `buildEnd`, call `slipway(siteConfig)` from it after your code.

3. Copy everything in [`starter/`](starter/) to the VitePress root (the folder that holds `.vitepress/`, often `docs/`) and adapt it.
4. Build and check:

   ```sh
   npx vitepress build .
   node packages/doctor/bin/slipway.mjs doctor <site> --build <site>/.vitepress/dist
   ```

## How it works

- `sourcePlugin` runs after VitePress's own markdown-it plugins, so a heading already has its `id`. It adds `data-source` with the file's path from the site root (the folder holding `.vitepress/`) and the heading's line. VitePress removes the front matter before rendering, so the plugin reads the source file and adds its line count back; the line is the one an editor shows.
- `buildEnd` reads VitePress's page list and each built page. Sections come from the built HTML: every heading with an `id` whose `data-source` names the page's own file. Their text is the heading as the page shows it, without the permalink anchor the theme adds.
- Links are read from the source file: inline links, `[text](href)`, outside front matter, fenced code, and code spans. Images, reference-style links (`[text][ref]`), autolinks, and links written as Vue components are left out.
- A page's `url` in the map is the path of its built file with `index.html` dropped (`/`, `/guide/`), or the `.html` file for any other page (`/guide/setup.html`). It is relative to the output folder, without `base`, so it resolves to a file in `.vitepress/dist/`.
- A page moved by `rewrites` keeps its original source path: `data-source` names the file an editor opens, and the map's `source` is the same file.
- Twins keep the site's `base`: with `base: "/docs/"`, the link in `<head>` points at `/docs/guide/setup.md`.

## Limits

- VitePress runs `buildEnd` only in `vitepress build`, so `vitepress dev` writes no map or twins.
- A heading that a Vue component renders gets no section. A heading that comes from a Markdown include carries the including page's file in `data-source`.
- Tested with one locale. A multilingual site builds each locale into the same output folder, so the last build's pages are the ones in `sourcemap.json`; separate maps per locale are not written yet.
- `.vitepress/config.mts` is TypeScript, so no content schema can check it and it cannot meet `ae.schemas.config`, which `slipway doctor` does not run yet. The starter schema covers the Markdown front matter.

## Tests

`test/vitepress.test.mjs` copies `test/site/` and `starter/` into a temporary folder, builds it, and checks the output with `slipway doctor` (level L2, no errors) and directly. The build tests need `VITEPRESS_MODULES` set to a `node_modules` folder that holds `vitepress`, and skip otherwise. The other tests run everywhere.
