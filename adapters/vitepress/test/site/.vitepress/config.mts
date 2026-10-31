import { pathToFileURL } from "node:url";
import { defineConfig } from "vitepress";

// The test sets SLIPWAY_VITEPRESS to this adapter's folder; a real site imports "slipway-vitepress".
const adapter = process.env.SLIPWAY_VITEPRESS
  ? pathToFileURL(`${process.env.SLIPWAY_VITEPRESS}/src/index.mjs`).href
  : "slipway-vitepress";

export default async function config() {
  const { default: slipway, sourcePlugin } = await import(adapter);
  return defineConfig({
    title: "Fixture",
    description: "The fixture site.",
    base: "/",
    srcExclude: ["AGENTS.md"],
    buildEnd: slipway,
    markdown: { config: (md) => md.use(sourcePlugin) },
  });
}
