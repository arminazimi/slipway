import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { cpSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readSection } from "../src/tools/read_section.mjs";
import { tools } from "../src/server.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const testDir = join(root, ".tmp/test-read-section");
const outside = join(root, ".tmp/test-read-section-outside.md");

before(() => {
  rmSync(testDir, { recursive: true, force: true });
  cpSync(join(root, "examples/docs"), testDir, { recursive: true });

  writeFileSync(outside, "# Outside\n\nNot part of the site.\n");
  symlinkSync(outside, join(testDir, "linked.md"));
});

after(() => {
  rmSync(testDir, { recursive: true, force: true });
  rmSync(outside, { force: true });
});

test("the tool is listed with an object input schema", () => {
  const tool = tools.find((entry) => entry.name === "read_section");
  assert.ok(tool, tools.map((entry) => entry.name).join(", "));
  assert.equal(tool.inputSchema.type, "object");
  assert.equal(tool.inputSchema.additionalProperties, false);
  assert.deepEqual(Object.keys(tool.inputSchema.properties), ["file", "heading", "line", "url"]);
  assert.equal(tool.annotations.readOnlyHint, true);
});

test("returns a section by url and heading", () => {
  const result = readSection(testDir, { url: "/guide/configure/", heading: "Tokens" });
  assert.equal(result.file, "guide/configure.md");
  assert.equal(result.heading, "Tokens");
  assert.equal(result.level, 2);
  assert.equal(result.startLine, 8);
  assert.equal(result.endLine, 16);
  assert.equal(result.markdown, [
    "## Tokens",
    "",
    "Tokens restyle the whole site. Each one maps to a CSS variable.",
    "",
    "```yaml",
    "slipway:",
    "  tokens:",
    "    radius: 0.75rem",
    "```",
  ].join("\n"));
});

test("a section ends at the next heading of the same or higher level", () => {
  const result = readSection(testDir, { file: "guide/write.md", heading: "Front matter" });
  assert.equal(result.startLine, 8);
  assert.equal(result.endLine, 18);

  const subsections = readSection(testDir, { file: "guide/write.md", heading: "Headings" });
  assert.equal(subsections.startLine, 20);
  assert.equal(subsections.endLine, 26);
  assert.match(subsections.markdown, /^### Code blocks/m);
});

test("a heading is found by its slug too", () => {
  const result = readSection(testDir, { file: "guide/configure.md", heading: "languages" });
  assert.equal(result.heading, "Languages");
  assert.equal(result.startLine, 18);
});

test("returns the section that holds a line", () => {
  const result = readSection(testDir, { file: "guide/write.md", line: "25" });
  assert.equal(result.file, "guide/write.md");
  assert.equal(result.heading, "Code blocks");
  assert.equal(result.level, 3);
  assert.equal(result.startLine, 24);
  assert.equal(result.endLine, 26);
});

test("refuses a file outside the site", () => {
  assert.throws(() => readSection(testDir, { file: "../test-read-section-outside.md", heading: "Outside" }), /outside the site directory/);
  assert.throws(() => readSection(testDir, { file: outside, heading: "Outside" }), /outside the site directory/);
  assert.throws(() => readSection(testDir, { file: "linked.md", heading: "Outside" }), /outside the site directory/);
  assert.throws(() => readSection(testDir, { url: "../../etc/passwd", heading: "root" }), /outside the site directory/);
});

test("refuses a bad input", () => {
  assert.throws(() => readSection(testDir, {}), /needs a url or a file/);
  assert.throws(() => readSection(testDir, { url: "/guide/configure/", file: "guide/configure.md", heading: "Tokens" }), /either a url or a file/);
  assert.throws(() => readSection(testDir, { file: "guide/configure.md" }), /needs a heading or a line/);
  assert.throws(() => readSection(testDir, { file: "guide/configure.md", heading: "Tokens", line: "8" }), /either a heading or a line/);
  assert.throws(() => readSection(testDir, { file: "guide/configure.md", line: "abc" }), /line must be a number/);
  assert.throws(() => readSection(testDir, { file: "guide/configure.md", line: "900" }), /past the end/);
  assert.throws(() => readSection(testDir, { file: "guide/configure.md", heading: "Nope" }), /no heading "Nope"/);
  assert.throws(() => readSection(testDir, { file: "guide/configure.md", line: "2" }), /before the first heading/);
  assert.throws(() => readSection(testDir, { url: "/guide/nope/", heading: "Tokens" }), /no page at/);
  assert.throws(() => readSection(testDir, { file: "guide/missing.md", heading: "Tokens" }), /does not exist/);
});
