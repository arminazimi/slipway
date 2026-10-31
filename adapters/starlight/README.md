# Slipway adapter for Astro Starlight

An Astro integration and a Markdown plugin that make a Starlight site [agent-editable](../../spec/agent-editable/0.1.md) up to level L2. It writes:

- `/sourcemap.json` ([format v0](../../spec/sourcemap/v0.md)): every page built from a file under `src/content/docs/`, its headings, and its inline links, each at its line in the source file.
- a Markdown twin of every such page at its address with `.md` (`/guides/intro/index.md` for `/guides/intro/`): the page's Markdown as written, without front matter, under its title as a heading unless it starts with one. Each page links its twin from `<head>` with `rel="alternate" type="text/markdown"`.
- `data-source="<source>:<line>"` on every Markdown heading, through a Sätteri mdast plugin, so an edit prompt can name the line.

Starlight writes the content folder, so the adapter ships `AGENTS.md` and the content schemas in [`starter/`](starter/) for the site to copy: `AGENTS.md`, `content-schemas.json`, and `schema/front-matter.schema.json` matching the Starlight content collection. Edit them to match the site; `slipway doctor` checks they stay true.

It needs Astro 7, Starlight 0.42, and Node.js 22.23.4 or later, and has no dependencies of its own. It writes nothing for L3 (the agent-skills index).

## Use it

1. Install it. It is not on npm yet, so copy this folder into the site (for example as `integrations/slipway-starlight/`) and run `npm install ./integrations/slipway-starlight`.
2. Add the integration, and the heading plugin to the Markdown processor, in `astro.config.mjs`:

   ```js
   import { defineConfig } from "astro/config";
   import starlight from "@astrojs/starlight";
   import { satteri } from "@astrojs/markdown-satteri";
   import slipway, { remarkSource } from "slipway-starlight";

   export default defineConfig({
     markdown: { processor: satteri({ mdastPlugins: [remarkSource()] }) },
     integrations: [starlight({ title: "My docs" }), slipway()],
   });
   ```

3. Copy everything in [`starter/`](starter/) to the site root and adapt it to the site's content collection.
4. Build and check:

   ```sh
   npx astro build
   node packages/doctor/bin/slipway.mjs doctor . --build dist
   ```

## How it works

- Starlight derives a page's URL from its file path, so `urlOf` does the same: `guides/intro.md` is `/guides/intro/`, `guides/index.md` is `/guides/`, and the top `index.md` is `/`. Files and folders starting with `_` or `.` are left out, as Astro does.
- `remarkSource()` runs inside the Sätteri processor and adds `data-source` from the file's path relative to the site folder (the folder with `astro.config.*`) and the heading's line in the source.
- After the build the integration reads each source file again, finds the built page (folder or file style, following the site's `trailingSlash`), collects the headings the plugin marked, and writes the twin and the source map. The heading text comes from the built page; the lines come from the source.
