#!/usr/bin/env node
// Usage: slipway-mcp [site-directory] | slipway-mcp --list-tools. Serves the site in the given directory, or the current one, over stdio.
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, tools } from "../src/server.mjs";

if (process.argv[2] === "--list-tools") {
  for (const { name, description } of tools) console.log(`${name}\t${description}`);
  process.exit(0);
}

const site = resolve(process.argv[2] ?? process.cwd());
if (!existsSync(site) || !statSync(site).isDirectory()) {
  console.error(`slipway-mcp: ${site} is not a directory`);
  process.exit(1);
}
await createServer(site).connect(new StdioServerTransport());
