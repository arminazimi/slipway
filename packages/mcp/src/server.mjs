// The Slipway MCP server over stdio. Its tools load from ./tools/. Errors come back as tool results with isError.
import { readdirSync, readFileSync } from "node:fs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

/** Every tool in ./tools/<name>.mjs, in sorted order: its `definition` and its `handler(site, args)`. */
export async function loadTools(dir = new URL("./tools/", import.meta.url)) {
  const files = readdirSync(dir).filter((file) => file.endsWith(".mjs")).sort();
  return Promise.all(files.map(async (file) => {
    const { definition, handler } = await import(new URL(file, dir));
    return { definition, handler };
  }));
}

const registry = await loadTools();
export const tools = registry.map(({ definition }) => definition);
const handlers = Object.fromEntries(registry.map(({ definition, handler }) => [definition.name, handler]));

export function createServer(site) {
  const server = new Server({ name: "slipway", version }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    const handler = handlers[params.name];
    try {
      if (!handler) throw new Error(`Unknown tool: ${params.name}`);
      const args = params.arguments ?? {};
      for (const [key, value] of Object.entries(args)) if (typeof value !== "string") throw new Error(`${key} must be a string`);
      return { content: [{ type: "text", text: JSON.stringify(await handler(site, args), null, 2) }] };
    } catch (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
  });
  return server;
}
