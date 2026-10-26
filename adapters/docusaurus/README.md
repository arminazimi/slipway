# Slipway adapter for Docusaurus

A Docusaurus plugin that makes a Docusaurus site [agent-editable](../../spec/agent-editable/0.1.md) up to level L2. It writes:

- `/sourcemap.json` ([format v0](../../spec/sourcemap/v0.md)): every page built from a Markdown or MDX file (docs, blog posts, and Markdown pages), its headings, and its inline links, each at its line in the source file, front matter included.
- a Markdown twin of every such page at its address with `.md` (`/docs/intro/index.md` for `/docs/intro/`): the page's Markdown as written, without front matter, under its title as a heading unless it starts with one. Each page links its twin from `<head>`.
- `data-source="<source>:<line>"` on every Markdown heading, through a remark plugin, so an edit prompt can name the line (`ae.edit-prompt.source`).

`AGENTS.md` and the content schemas live in the site's source folder, which a plugin should not write, so the adapter ships them in [`starter/`](starter/) for the site to copy: `AGENTS.md`, `content-schemas.json`, and `schema/` with schemas for doc, blog post, and page front matter, `_category_.json`, and `blog/authors.yml`. Edit them to match the site; `slipway doctor` checks they stay true.

It needs Docusaurus 3 and has no dependencies of its own. It writes nothing for L3 (the agent-skills index).

## Use it

1. Install it. It is not on npm yet, so copy this folder into the site (for example as `plugins/slipway-docusaurus/`) and run `npm install ./plugins/slipway-docusaurus`.
2. Add the plugin, and the remark plugin to each content plugin, in `docusaurus.config.js`. Docusaurus has no site-wide remark setting, so each content plugin lists it:

   ```js
   import slipway, { remarkSource } from "slipway-docusaurus";

   export default {
     // ...
     presets: [
       [
         "classic",
         {
           docs: { remarkPlugins: [remarkSource] },
           blog: { remarkPlugins: [remarkSource] },
           pages: { remarkPlugins: [remarkSource] },
         },
       ],
     ],
     plugins: [slipway],
   };
   ```

   A site whose config is CommonJS loads it with `const { default: slipway, remarkSource } = await import("slipway-docusaurus")` inside an async config function.

3. Copy everything in [`starter/`](starter/) to the site root and adapt it: remove the lines for `blog/` or `src/pages/` if the site has none.
4. Build and check:

   ```sh
   npx docusaurus build
   node packages/doctor/bin/slipway.mjs doctor <site> --build <site>/build
   ```

## How it works

- `remarkSource` runs after Docusaurus's own remark plugins, so a heading already has its `id`, including a custom one written as `{#id}`. It adds `data-source` with the file's path from the site folder (the folder with `docusaurus.config.*`) and the heading's line. Docusaurus 3 gives remark the whole file, front matter included, so the line is the one an editor shows.
- After the build, the plugin finds every page in the content of all plugins: any entry with a `permalink` and a `source` that is a `.md` or `.mdx` file in the site folder. Pages written in React (`src/pages/*.js`) are left out: they are not content files.
- Sections come from the built HTML: every heading with an `id` whose `data-source` names the page's own file. Their text is the heading as the page shows it, without the `#` link the theme adds. A doc's title heading (`h1`) has no `id` in Docusaurus, so it carries `data-source` but is not a section.
- Links are read from the source file: inline links, `[text](href)`, outside front matter, fenced code, and code spans. Images, reference-style links (`[text][ref]`), autolinks, and links written as JSX are left out.
- A page's `url` in the map is the path of its built file with `index.html` dropped (`/docs/intro/`), so it resolves to a file in `build/` whatever `trailingSlash` says; with `trailingSlash: false` it is `/docs/intro.html`.

## Limits

- A heading that an MDX file renders from a component or an imported partial gets no section on the importing page. A partial's headings carry its own file in `data-source`.
- Tested with one locale only. Docusaurus builds each other locale into its own folder (`build/fa/`) and runs `postBuild` for it, so each locale should get its own `sourcemap.json`; that is not checked yet.
- Docusaurus runs `postBuild` only in `docusaurus build`, so `docusaurus start` writes no map or twins.
- `docusaurus.config.js` and `sidebars.js` are JavaScript, so no content schema can check them and they cannot meet `ae.schemas.config`, which `slipway doctor` does not run yet. The starter schemas cover the YAML and JSON files a Docusaurus site reads: `_category_` files and `blog/authors.yml`.

## Tests

`test/docusaurus.test.mjs` copies `test/site/` and `starter/` into a temporary folder, builds it, and checks the output with `slipway doctor` (level L2, no errors) and directly. The build tests need `DOCUSAURUS_MODULES` set to a `node_modules` folder that holds `@docusaurus/core`, `@docusaurus/preset-classic`, `react`, and `react-dom`, and skip otherwise; CI installs them. The other tests run everywhere.
