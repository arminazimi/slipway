import assert from "node:assert";
import { cpSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const bin = new URL("../bin/slipway-mcp.mjs", import.meta.url).pathname;

async function connect(site, t) {
  const client = new Client({ name: "slipway-test", version: "0.0.0" });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [bin, site], stderr: "pipe" }));
  t.after(() => client.close());
  return client;
}

const json = (result) => JSON.parse(result.content[0].text);

test("findings_for_file returns findings for a specific file", async (t) => {
  const site = mkdtempSync(join(tmpdir(), "slipway-mcp-"));
  t.after(() => rmSync(site, { recursive: true, force: true }));
  // Copy examples/docs to a temp dir so we don't write to examples/
  cpSync(new URL("../../../examples/docs", import.meta.url).pathname, site, { recursive: true });

  const client = await connect(site, t);
  const result = await client.callTool({ name: "findings_for_file", arguments: { file: "AGENTS.md" } });

  assert.equal(result.isError, undefined, result.content?.[0]?.text);
  const { findings } = json(result);

  assert.ok(findings.length > 0, "Expected some findings for AGENTS.md");
  assert.equal(findings[0].file, "AGENTS.md");
  assert.ok(findings.every((f) => f.file === "AGENTS.md"), "All findings should be for AGENTS.md");
});

test("findings_for_file refuses paths outside the site", async (t) => {
  const site = mkdtempSync(join(tmpdir(), "slipway-mcp-"));
  const outside = mkdtempSync(join(tmpdir(), "slipway-mcp-outside-"));
  t.after(() => {
    rmSync(site, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  });
  // Setup outside file and symlink
  writeFileSync(join(outside, "secret.txt"), "secret");
  symlinkSync(join(outside, "secret.txt"), join(site, "linked.txt"));

  const client = await connect(site, t);

  for (const file of ["../secret.txt", join(outside, "secret.txt")]) {
    const result = await client.callTool({ name: "findings_for_file", arguments: { file } });
    assert.equal(result.isError, true, file);
    assert.match(result.content[0].text, /outside the site/, file);
  }
});

test("findings_for_file handles bad input", async (t) => {
  const site = mkdtempSync(join(tmpdir(), "slipway-mcp-"));
  t.after(() => rmSync(site, { recursive: true, force: true }));

  const client = await connect(site, t);

  // missing file arg is caught by MCP's schema validation or server.mjs string check
  const missingArg = await client.callTool({ name: "findings_for_file", arguments: {} });
  assert.equal(missingArg.isError, true);
  assert.ok(missingArg.content[0].text.includes("must be a string") || missingArg.content[0].text.includes("Invalid arguments") || missingArg.content[0].text.includes("Required"), missingArg.content[0].text);

  // number instead of string
  const numberArg = await client.callTool({ name: "findings_for_file", arguments: { file: 123 } });
  assert.equal(numberArg.isError, true);
  assert.ok(numberArg.content[0].text.includes("must be a string") || numberArg.content[0].text.includes("Invalid arguments"), numberArg.content[0].text);
});
