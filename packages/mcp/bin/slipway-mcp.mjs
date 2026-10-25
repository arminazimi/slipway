#!/usr/bin/env node
// Usage: slipway-mcp [site-directory]. Serves the site in the given directory, or the current one, over stdio.
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "../src/server.mjs";

const site = resolve(process.argv[2] ?? process.cwd());
if (!existsSync(site) || !statSync(site).isDirectory()) {
  console.error(`slipway-mcp: ${site} is not a directory`);
  process.exit(1);
}
await createServer(site).connect(new StdioServerTransport());
