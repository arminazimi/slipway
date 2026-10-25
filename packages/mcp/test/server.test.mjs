import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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

test("initialize names the server", async (t) => {
  const client = await connect(docs, t);
  assert.equal(client.getServerVersion().name, "slipway");
  assert.ok(client.getServerCapabilities().tools);
});

test("tools/list returns exactly the two read-only tools with JSON Schema inputs", async (t) => {
  const { tools } = await (await connect(docs, t)).listTools();
  assert.deepEqual(tools.map((tool) => tool.name).sort(), ["list_layouts", "read_config"]);
  for (const tool of tools) {
    assert.equal(tool.inputSchema.type, "object");
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.equal(tool.annotations.readOnlyHint, true);
  }
});

test("list_layouts lists the theme's layouts for examples/docs", async (t) => {
  const result = await (await connect(docs, t)).callTool({ name: "list_layouts", arguments: {} });
  assert.ok(!result.isError, result.content[0].text);
  const layouts = json(result).layouts;
  const names = layouts.map((layout) => layout.name);
  for (const name of ["base", "doc", "home", "page", "post"]) assert.ok(names.includes(name), name);
  const doc = layouts.find((layout) => layout.name === "doc");
  assert.equal(doc.source, "theme");
  assert.equal(doc.extends, "base");
  for (const layout of layouts) {
    assert.ok(layout.schema === null || typeof layout.schema === "object", layout.name);
    assert.equal(layout.schema === null, layout.schemaFile === null, layout.name);
  }
});

test("read_config returns the validated _config.yml of examples/docs", async (t) => {
  const result = await (await connect(docs, t)).callTool({ name: "read_config", arguments: {} });
  assert.ok(!result.isError, result.content[0].text);
  const config = json(result);
  assert.equal(config.file, "_config.yml");
  assert.equal(config.valid, true);
  assert.deepEqual(config.errors, []);
  assert.equal(config.config.title, "Slipway docs");
});

test("a site's own layout overrides the theme's, and an invalid config reports its errors", async (t) => {
  const site = mkdtempSync(join(tmpdir(), "slipway-mcp-"));
  t.after(() => rmSync(site, { recursive: true, force: true }));
  mkdirSync(join(site, "_layouts"));
  writeFileSync(join(site, "_layouts/page.html"), "---\nlayout: default\n---\n{{ content }}\n");
  writeFileSync(join(site, "_layouts/custom.html"), "{{ content }}\n");
  writeFileSync(join(site, "_config.yml"), "title: 3\n");
  const client = await connect(site, t);
  const layouts = json(await client.callTool({ name: "list_layouts", arguments: {} })).layouts;
  const page = layouts.find((layout) => layout.name === "page");
  assert.equal(page.source, "site");
  assert.equal(page.extends, "default");
  assert.equal(layouts.find((layout) => layout.name === "custom").source, "site");
  const config = json(await client.callTool({ name: "read_config", arguments: {} }));
  assert.equal(config.valid, false);
  assert.ok(config.errors.some((error) => error.startsWith("/title")), config.errors.join("\n"));
});

test("paths outside the site are refused as tool errors, and the server keeps running", async (t) => {
  const site = mkdtempSync(join(tmpdir(), "slipway-mcp-"));
  const outside = mkdtempSync(join(tmpdir(), "slipway-mcp-outside-"));
  t.after(() => {
    rmSync(site, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  });
  writeFileSync(join(outside, "secret.yml"), "title: secret\n");
  symlinkSync(join(outside, "secret.yml"), join(site, "linked.yml"));
  writeFileSync(join(site, "broken.yml"), "title: [\n");
  const client = await connect(site, t);
  for (const file of ["../secret.yml", join(outside, "secret.yml"), "linked.yml"]) {
    const result = await client.callTool({ name: "read_config", arguments: { file } });
    assert.equal(result.isError, true, file);
    assert.match(result.content[0].text, /outside the site/, file);
  }
  for (const [args, message] of [
    [{ file: "package.json" }, /not a YAML config file/],
    [{ file: "missing.yml" }, /does not exist/],
    [{ file: "broken.yml" }, /not valid YAML/],
    [{ file: 3 }, /must be a string/],
  ]) {
    const result = await client.callTool({ name: "read_config", arguments: args });
    assert.equal(result.isError, true, JSON.stringify(args));
    assert.match(result.content[0].text, message);
  }
  const unknown = await client.callTool({ name: "write_file", arguments: {} });
  assert.equal(unknown.isError, true);
  assert.equal((await client.callTool({ name: "list_layouts", arguments: {} })).isError, undefined);
});
