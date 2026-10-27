// The Slipway MCP server: three read-only tools over stdio. Errors come back as tool results with isError.
import { readFileSync } from "node:fs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { levels } from "../../doctor/src/doctor.mjs";
import { listLayouts, readConfig, runDoctor, createPage, setToken, addNavigationItem, preview } from "./tools.mjs";

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
  {
    name: "doctor",
    description:
      "Run slipway doctor on the site: check its source and, with build, its built output against the agent-editable site spec. Returns ok, the level reached, and every finding with its file, line, and fix. Run it after each edit and fix what it finds. Never uses the network.",
    inputSchema: {
      type: "object",
      properties: {
        build: { type: "string", description: "The built output folder, relative to the site directory (such as _site). Without it, the tests on the output fail." },
        level: { type: "string", enum: levels, description: "ok is true when the site reaches this level. Without it, ok is true when every MUST test passes." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },

  {
    name: "create_page",
    description: "Create a new page or post.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to the file to create, relative to the site directory." },
        frontMatter: { type: "string", description: "Front matter for the page as a JSON string." },
        content: { type: "string", description: "Markdown content for the page." },
      },
      required: ["path", "frontMatter", "content"],
      additionalProperties: false,
    },
  },
  {
    name: "set_token",
    description: "Set a theme token in _config.yml.",
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string", description: "Token name (e.g. accent, canvas)." },
        value: { type: "string", description: "Token value (e.g. a color)." },
      },
      required: ["token", "value"],
      additionalProperties: false,
    },
  },
  {
    name: "add_navigation_item",
    description: "Add a link to the main navigation menu in _data/navigation.yml.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "The text of the link." },
        url: { type: "string", description: "The URL of the link." },
      },
      required: ["title", "url"],
      additionalProperties: false,
    },
  },
  {
    name: "preview",
    description: "Get instructions on how to preview the site locally.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

const handlers = {
  list_layouts: (site) => ({ layouts: listLayouts(site) }),
  read_config: (site, args) => readConfig(site, args.file ?? "_config.yml"),
  doctor: (site, args) => runDoctor(site, args),
  create_page: (site, args) => createPage(site, args),
  set_token: (site, args) => setToken(site, args),
  add_navigation_item: (site, args) => addNavigationItem(site, args),
  preview: (site) => preview(site),
};

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
