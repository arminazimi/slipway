import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadTools, tools } from "../src/server.mjs";

const bin = fileURLToPath(new URL("../bin/slipway-mcp.mjs", import.meta.url));
const toolsDir = new URL("../src/tools/", import.meta.url);

test("every file in src/tools/ is a tool named after its file, loaded in sorted order", async () => {
  const files = readdirSync(toolsDir).filter((file) => file.endsWith(".mjs")).sort();
  const loaded = await loadTools();
  assert.deepEqual(loaded.map(({ definition }) => definition.name + ".mjs"), files);
  for (const { definition, handler } of loaded) {
    assert.equal(typeof handler, "function", `${definition.name} exports a handler`);
    assert.equal(definition.inputSchema.type, "object", `${definition.name} has an object input schema`);
  }
  assert.deepEqual(tools, loaded.map(({ definition }) => definition));
});

test("--list-tools prints every tool and its description", () => {
  const lines = execFileSync("node", [bin, "--list-tools"], { encoding: "utf8" }).trim().split("\n");
  assert.deepEqual(lines.map((line) => line.split("\t")[0]), tools.map((tool) => tool.name));
  for (const [i, line] of lines.entries()) assert.equal(line.split("\t")[1], tools[i].description);
});
