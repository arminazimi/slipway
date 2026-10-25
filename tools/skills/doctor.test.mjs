import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { tools } from "../../packages/mcp/src/server.mjs";
import { parseArgs } from "../../packages/doctor/src/cli.mjs";
import { root } from "./config-reference.mjs";

const skillDir = join(root, "skills/slipway-doctor");
const skill = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const [, frontMatter, body] = skill.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];

test("the doctor skill has valid frontmatter and stays under 150 lines", () => {
  assert.ok(frontMatter, "frontmatter block");
  const meta = parse(frontMatter);
  assert.deepEqual(Object.keys(meta).sort(), ["description", "name"]);
  assert.equal(meta.name, "slipway-doctor");
  assert.match(meta.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.equal(typeof meta.description, "string");
  assert.ok(meta.description.length > 0 && meta.description.length <= 1024);
  assert.doesNotMatch(meta.description, /[<>\n]/);
  assert.ok(skill.split("\n").length < 150, `${skill.split("\n").length} lines`);
});

test("every repository path and link the doctor skill names exists", () => {
  const repo = [...body.matchAll(/https:\/\/github\.com\/arminazimi\/slipway\/(?:blob|tree)\/main\/([^\s)]+?)\.?(?=[\s)]|$)/g)].map((m) => m[1]);
  const paths = [...body.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]).filter((s) => !s.includes(" ") && s.includes("/") && !s.startsWith("<"));
  assert.ok(repo.length >= 2 && paths.length >= 2, "found the references");
  for (const p of [...repo, ...paths]) assert.ok(existsSync(join(root, p)), p);
});

test("the doctor skill's command parses, and its MCP inputs match the server's doctor tool", () => {
  const commands = [...body.matchAll(/```sh\n([\s\S]*?)```/g)].flatMap((m) => m[1].trim().split("\n"));
  assert.ok(commands.length > 0);
  for (const command of commands) {
    const [, script, ...args] = command.split(" ");
    assert.ok(existsSync(join(root, script)), script);
    assert.ok(parseArgs(args).options, command);
  }
  const tool = tools.find((t) => t.name === "doctor");
  assert.ok(tool, "the MCP server has a doctor tool");
  assert.match(body, /the `doctor` tool/);
  const inputs = [...body.matchAll(/^\| `(\w+)` \|/gm)].map((m) => m[1]);
  assert.deepEqual(inputs.sort(), Object.keys(tool.inputSchema.properties).sort());
  for (const level of tool.inputSchema.properties.level.enum) assert.ok(body.includes(level), level);
});
