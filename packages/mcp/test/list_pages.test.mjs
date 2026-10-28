import { test } from "node:test";
import assert from "node:assert/strict";
import fs, { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const bin = fileURLToPath(new URL("../bin/slipway-mcp.mjs", import.meta.url));
const docs = fileURLToPath(new URL("../../../examples/docs", import.meta.url));

async function connect(site, t) {
  const transport = new StdioClientTransport({ command: "node", args: [bin, site] });
  const client = new Client({ name: "slipway-test", version: "0.0.0" }, { capabilities: {} });
  await client.connect(transport);
  if (t) t.after(() => transport.close());
  return client;
}

const json = (result) => JSON.parse(result.content[0].text);

test("list_pages lists all pages in examples/docs", async (t) => {
  const tmpDocs = mkdtempSync(join(tmpdir(), "slipway-mcp-docs-"));
  t.after(() => rmSync(tmpDocs, { recursive: true, force: true }));
  fs.cpSync(docs, tmpDocs, { recursive: true });

  const client = await connect(tmpDocs, t);
  const result = await client.callTool({ name: "list_pages", arguments: {} });

  assert.ok(!result.isError, result.content?.[0]?.text);
  const data = json(result);
  assert.ok(Array.isArray(data.pages));

  const index = data.pages.find((p) => p.source === "index.md");
  assert.ok(index);
  assert.equal(index.url, "/");
  assert.equal(index.layout, "home");
  assert.equal(index.title, "Docs for a Slipway site");
});

test("list_pages filters by folder, layout, and lang", async (t) => {
  const site = mkdtempSync(join(tmpdir(), "slipway-mcp-"));
  t.after(() => rmSync(site, { recursive: true, force: true }));

  writeFileSync(join(site, "index.md"), "---\nlayout: home\ntitle: Home\nlang: en\n---\n");

  mkdirSync(join(site, "about"));
  writeFileSync(join(site, "about/index.md"), "---\nlayout: page\ntitle: About\nlang: en\n---\n");

  mkdirSync(join(site, "fr"));
  writeFileSync(join(site, "fr/index.md"), "---\nlayout: home\ntitle: Accueil\nlang: fr\n---\n");

  const client = await connect(site, t);

  // Filter by layout
  const resLayout = await client.callTool({ name: "list_pages", arguments: { layout: "page" } });
  assert.ok(!resLayout.isError);
  const dataLayout = json(resLayout);
  assert.equal(dataLayout.pages.length, 1);
  assert.equal(dataLayout.pages[0].source, "about/index.md");

  // Filter by lang
  const resLang = await client.callTool({ name: "list_pages", arguments: { lang: "fr" } });
  assert.ok(!resLang.isError);
  const dataLang = json(resLang);
  assert.equal(dataLang.pages.length, 1);
  assert.equal(dataLang.pages[0].source, "fr/index.md");

  // Filter by folder
  const resFolder = await client.callTool({ name: "list_pages", arguments: { folder: "about" } });
  assert.ok(!resFolder.isError);
  const dataFolder = json(resFolder);
  assert.equal(dataFolder.pages.length, 1);
  assert.equal(dataFolder.pages[0].source, "about/index.md");
});

test("list_pages refuses invalid inputs and outside folder paths", async (t) => {
  const site = mkdtempSync(join(tmpdir(), "slipway-mcp-"));
  t.after(() => rmSync(site, { recursive: true, force: true }));

  const client = await connect(site, t);

  // Invalid input (non-string)
  const resBadInput = await client.callTool({ name: "list_pages", arguments: { layout: 123 } });
  assert.equal(resBadInput.isError, true);
  assert.match(resBadInput.content[0].text, /must be a string/);

  // Outside folder path
  const resOutside = await client.callTool({ name: "list_pages", arguments: { folder: "../outside" } });
  assert.equal(resOutside.isError, true);
  assert.match(resOutside.content[0].text, /outside the site directory/);
});
