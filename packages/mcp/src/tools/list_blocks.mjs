import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { insideSite, themeRoot } from "../tools.mjs";

export const definition = {
  name: "list_blocks",
  description: "List every block with its option schema and one example snippet, read from the Block API's files.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: true },
};

function blocksIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((file) => file.endsWith(".html")).map((file) => ({ name: file.slice(0, -5), file: join(dir, file) }));
}

/** Every block the theme provides. Note: for now, it's just the theme. If a site creates blocks, they would also be listed here. */
export function listBlocks(site) {
  const blocks = new Map();

  for (const { name, file } of blocksIn(join(themeRoot, "_includes/blocks"))) blocks.set(name, { name, source: "theme", file });

  const own = join(site, "_includes/blocks");
  if (existsSync(own)) {
    for (const { name, file } of blocksIn(insideSite(site, "_includes/blocks"))) blocks.set(name, { name, source: "site", file });
  }

  return [...blocks.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name, source, file }) => {
      let schemaFile = join(themeRoot, `schema/blocks/${name}.schema.json`);
      let schemaFileRel = null;
      let schema = null;

      if (source === "theme" && existsSync(schemaFile)) {
        schemaFileRel = relative(themeRoot, schemaFile);
        schema = JSON.parse(readFileSync(schemaFile, "utf8"));
      } else if (source === "site") {
        const siteSchema = join(site, `schema/blocks/${name}.schema.json`);
        if (existsSync(siteSchema)) {
          schemaFile = insideSite(site, `schema/blocks/${name}.schema.json`);
          schemaFileRel = relative(site, schemaFile);
          schema = JSON.parse(readFileSync(schemaFile, "utf8"));
        }
      }

      let snippet = null;
      const snippetMatch = /^{% include blocks\/.* %}/m.exec(readFileSync(file, 'utf8'));
      if (snippetMatch) {
         snippet = snippetMatch[0];
      }

      return { name, source, file: source === 'theme' ? relative(themeRoot, file) : relative(site, file), snippet, schemaFile: schemaFileRel, schema };
    });
}

export const handler = (site) => ({ blocks: listBlocks(site) });
