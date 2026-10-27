import { test } from "node:test";
import assert from "node:assert/strict";
import fs, { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const bin = fileURLToPath(new URL("../bin/slipway-mcp.mjs", import.meta.url));
const docs = fileURLToPath(new URL("../../../examples/docs", import.meta.url));

async function connect(site, t) {
  const client = new Client({ name: "slipway-test", version: "0.0.0" });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [bin, site], stderr: "pipe" }));
  t.after(() => client.close());
  return client;
}

const json = (result) => JSON.parse(result.content[0].text);

test("list_blocks works", async (t) => {
  const site = mkdtempSync(join(tmpdir(), "slipway-mcp-"));
  t.after(() => rmSync(site, { recursive: true, force: true }));
  mkdirSync(join(site, "_includes/blocks"), { recursive: true });
  mkdirSync(join(site, "schema/blocks"), { recursive: true });

  writeFileSync(join(site, "_includes/blocks/test.html"), "{% include blocks/test.html text=\"test\" %}");
  writeFileSync(join(site, "schema/blocks/test.schema.json"), '{"type": "object"}');

  const client = await connect(site, t);
  const result = await client.callTool({ name: "list_blocks", arguments: {} });

  assert.ok(!result.isError, result.content[0].text);
  const blocks = json(result).blocks;

  const b = blocks.find(x => x.name === 'test');
  assert.ok(b);
  assert.equal(b.snippet, '{% include blocks/test.html text="test" %}');
  assert.deepEqual(b.schema, {type: "object"});
});
