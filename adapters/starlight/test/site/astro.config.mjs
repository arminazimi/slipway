// The test sets SLIPWAY_STARLIGHT to this adapter's folder; a real site imports "slipway-starlight".
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { satteri } from "@astrojs/markdown-satteri";

const adapter = process.env.SLIPWAY_STARLIGHT ? `${process.env.SLIPWAY_STARLIGHT}/src/index.mjs` : "slipway-starlight";
const { default: slipway, remarkSource } = await import(adapter);

export default defineConfig({
  site: "https://example.com",
  // Starlight 0.42 runs Astro's Sätteri processor; the heading plugin is a Sätteri mdast plugin.
  markdown: { processor: satteri({ mdastPlugins: [remarkSource()] }) },
  integrations: [starlight({ title: "Fixture" }), slipway()],
  // The test builds inside the shared modules folder, whose node_modules is a real folder.
  vite: { resolve: { preserveSymlinks: true } },
});
