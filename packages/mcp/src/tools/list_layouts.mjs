import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "yaml";
import { insideSite, themeRoot } from "../tools.mjs";

const frontMatterDir = join(themeRoot, "schema/front-matter");
// Layouts without a schema of their own use these (schema/front-matter/README.md); any other layout uses `base`.
const schemaFallback = { default: "page", tags: "page", "not-found": "page" };

export const definition = {
  name: "list_layouts",
  description: "List the layouts this Slipway site can use (the theme's and the site's own), each with the JSON Schema of its front matter.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: true },
};

function frontMatter(file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, "utf8"));
  return match ? (parse(match[1]) ?? {}) : {};
}

function layoutSchema(name) {
  for (const candidate of [name, schemaFallback[name], "base"]) {
    const file = candidate && join(frontMatterDir, `${candidate}.schema.json`);
    if (file && existsSync(file)) return { schemaFile: relative(themeRoot, file), schema: JSON.parse(readFileSync(file, "utf8")) };
  }
  return { schemaFile: null, schema: null };
}

function layoutsIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((file) => file.endsWith(".html")).map((file) => ({ name: file.slice(0, -5), file: join(dir, file) }));
}

/** Every layout the site can use: the theme's, with the site's own `_layouts` overriding them by name. */
export function listLayouts(site) {
  const layouts = new Map();
  for (const { name, file } of layoutsIn(join(themeRoot, "_layouts"))) layouts.set(name, { name, source: "theme", file });
  const own = join(site, "_layouts");
  if (existsSync(own)) {
    for (const { name, file } of layoutsIn(insideSite(site, "_layouts"))) layouts.set(name, { name, source: "site", file });
  }
  return [...layouts.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name, source, file }) => ({ name, source, extends: frontMatter(file).layout ?? null, ...layoutSchema(name) }));
}

export const handler = (site) => ({ layouts: listLayouts(site) });
