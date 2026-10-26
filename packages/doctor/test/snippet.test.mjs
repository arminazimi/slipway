import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "../src/cli.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const snippetPath = join(repo, "docs/snippets/agents-md.md");

test("the snippet file exists and is at most 30 lines", () => {
  assert.ok(existsSync(snippetPath), "the snippet file exists");
  const content = readFileSync(snippetPath, "utf8");
  const lines = content.split("\n");
  assert.ok(lines.length <= 30, `the snippet file has ${lines.length} lines, which is more than 30`);
});

test("every npx slipway doctor command parses with real CLI flags", () => {
  const content = readFileSync(snippetPath, "utf8");
  const regex = /npx\s+slipway\s+doctor\s+([^`\n]+)/g;
  let match;
  let matches = 0;
  while ((match = regex.exec(content)) !== null) {
    matches++;
    const argsStr = match[1].trim();
    // Use simple splitting for this test since we know the snippet format
    const args = ["doctor", ...argsStr.split(/\s+/)];

    // Handle the <source dir> and <build dir> correctly which are split into two array elements
    const unifiedArgs = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "<source" && args[i+1] === "dir>") {
        unifiedArgs.push(".");
        i++;
      } else if (args[i] === "<build" && args[i+1] === "dir>") {
        unifiedArgs.push("_site");
        i++;
      } else {
        unifiedArgs.push(args[i]);
      }
    }

    const parsed = parseArgs(unifiedArgs);
    assert.ok(!parsed.error, `failed to parse command: npx slipway ${args.join(" ")}\nError: ${parsed.error}`);
  }
  assert.ok(matches > 0, "no 'npx slipway doctor' commands found in snippet");
});

test("every relative path linked in the snippet exists", () => {
  const content = readFileSync(snippetPath, "utf8");
  const regex = /\[.*?\]\((?!http)(.*?)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const linkPath = match[1];
    if (linkPath.startsWith("#")) continue;
    const fullPath = join(repo, "docs/snippets", linkPath);
    assert.ok(existsSync(fullPath), `linked path does not exist: ${linkPath}`);
  }
});
