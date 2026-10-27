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
const conforming = fileURLToPath(new URL("../../doctor/test/fixtures/conforming", import.meta.url));

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

test("tools/list returns exactly the tools with JSON Schema inputs", async (t) => {
  const { tools } = await (await connect(docs, t)).listTools();
  assert.deepEqual(tools.map((tool) => tool.name).sort(), ["add_navigation_item", "create_page", "doctor", "list_blocks", "list_layouts", "preview", "read_config", "set_token"]);
  for (const tool of tools) {
    assert.equal(tool.inputSchema.type, "object");
    assert.equal(tool.inputSchema.additionalProperties, false);
    if (["doctor", "list_blocks", "list_layouts", "read_config"].includes(tool.name)) assert.equal(tool.annotations.readOnlyHint, true);
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

test("doctor reports L3 and ok for a conforming site with its built output", async (t) => {
  const result = await (await connect(conforming, t)).callTool({ name: "doctor", arguments: { build: "build", level: "L3" } });
  assert.ok(!result.isError, result.content[0].text);
  const report = json(result);
  assert.equal(report.ok, true);
  assert.equal(report.target, "L3");
  assert.equal(report.spec, "agent-editable");
  assert.equal(report.level, "L3");
  assert.deepEqual(report.findings, []);
});

test("doctor returns findings with files, and ok false, for a site that fails MUST tests", async (t) => {
  const report = json(await (await connect(docs, t)).callTool({ name: "doctor", arguments: {} }));
  assert.equal(report.ok, false);
  assert.equal(report.target, null);
  assert.equal(report.level, null);
  const missing = report.findings.find((finding) => finding.file === "AGENTS.md");
  assert.ok(missing, JSON.stringify(report.findings));
  assert.equal(missing.severity, "error");
  assert.equal(missing.in, "source");
});

test("doctor refuses a build folder outside the site and an unknown level", async (t) => {
  const client = await connect(conforming, t);
  const outside = await client.callTool({ name: "doctor", arguments: { build: "../jekyll-pass" } });
  assert.equal(outside.isError, true);
  assert.match(outside.content[0].text, /outside the site directory/);
  const level = await client.callTool({ name: "doctor", arguments: { level: "L9" } });
  assert.equal(level.isError, true);
  assert.match(level.content[0].text, /level must be one of L0, L1, L2, L3/);
  const notString = await client.callTool({ name: "doctor", arguments: { build: 1 } });
  assert.equal(notString.isError, true);
  assert.match(notString.content[0].text, /build must be a string/);
});


test("create_page writes a Markdown file with front matter to the site", async (t) => {
  const site = mkdtempSync(join(tmpdir(), "slipway-mcp-"));
  t.after(() => rmSync(site, { recursive: true, force: true }));
  const client = await connect(site, t);
  const result = await client.callTool({
    name: "create_page",
    arguments: { path: "new.md", frontMatter: '{"title":"T"}', content: "Hello" }
  });
  assert.ok(!result.isError, result.content[0].text);
  const fileContent = fs.readFileSync(join(site, "new.md"), "utf8");
  assert.match(fileContent, /---\ntitle: T\n---\nHello/);
});

test("set_token sets a token in _config.yml", async (t) => {
  const site = mkdtempSync(join(tmpdir(), "slipway-mcp-"));
  t.after(() => rmSync(site, { recursive: true, force: true }));
  const client = await connect(site, t);
  const result = await client.callTool({
    name: "set_token",
    arguments: { token: "accent", value: "red" }
  });
  assert.ok(!result.isError, result.content[0].text);
  const fileContent = fs.readFileSync(join(site, "_config.yml"), "utf8");
  assert.match(fileContent, /slipway:\n  tokens:\n    accent: red/);
});

test("add_navigation_item adds an item to _data/navigation.yml", async (t) => {
  const site = mkdtempSync(join(tmpdir(), "slipway-mcp-"));
  t.after(() => rmSync(site, { recursive: true, force: true }));
  const client = await connect(site, t);
  const result = await client.callTool({
    name: "add_navigation_item",
    arguments: { title: "Home", url: "/" }
  });
  assert.ok(!result.isError, result.content[0].text);
  const fileContent = fs.readFileSync(join(site, "_data/navigation.yml"), "utf8");
  assert.match(fileContent, /- title: Home\n    url: \//);
});

test("preview returns instructions with jekyll serve", async (t) => {
  const site = mkdtempSync(join(tmpdir(), "slipway-mcp-"));
  t.after(() => rmSync(site, { recursive: true, force: true }));
  const client = await connect(site, t);
  const result = await client.callTool({ name: "preview", arguments: {} });
  assert.ok(!result.isError, result.content[0].text);
  const parsed = json(result);
  assert.match(parsed.instructions, /jekyll serve/);
});
