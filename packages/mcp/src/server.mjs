// The Slipway MCP server: two read-only tools over stdio. Errors come back as tool results with isError.
import { readFileSync } from "node:fs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { listLayouts, readConfig } from "./tools.mjs";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

export const tools = [
  {
    name: "list_layouts",
    description: "List the layouts this Slipway site can use (the theme's and the site's own), each with the JSON Schema of its front matter.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
  },
  {
    name: "read_config",
    description: "Read the site's _config.yml (or another YAML config inside the site) and validate it against Slipway's config schema.",
    inputSchema: {
      type: "object",
      properties: {
        file: { type: "string", description: "Config file, relative to the site directory.", default: "_config.yml" },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
  },
];

const handlers = {
  list_layouts: (site) => ({ layouts: listLayouts(site) }),
  read_config: (site, args) => readConfig(site, args.file ?? "_config.yml"),
};

export function createServer(site) {
  const server = new Server({ name: "slipway", version }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    const handler = handlers[params.name];
    try {
      if (!handler) throw new Error(`Unknown tool: ${params.name}`);
      const args = params.arguments ?? {};
      if (args.file !== undefined && typeof args.file !== "string") throw new Error("file must be a string");
      return { content: [{ type: "text", text: JSON.stringify(handler(site, args), null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
  });
  return server;
}
