import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { validateConfig } from "./config.mjs";
import { root } from "./build.mjs";

test("Lifecycle recipe config snippets validate", () => {
  const content = readFileSync(join(root, "site/recipes/lifecycle.md"), "utf8");

  const yamlBlocks = [...content.matchAll(/```yaml\n([\s\S]*?)```/g)];
  assert.ok(yamlBlocks.length > 0, "has at least one yaml block");

  for (const block of yamlBlocks) {
    const yamlStr = block[1];
    // Only validate against Slipway config schema if it is not a GitHub Actions workflow YAML
    if (yamlStr.includes("name: ") || yamlStr.includes("uses: ")) {
      assert.doesNotThrow(() => parse(yamlStr), `YAML snippet invalid:\n\nSnippet:\n${yamlStr}`);
    } else {
      const config = parse(yamlStr);
      const { ok, errors } = validateConfig(config);
      assert.equal(ok, true, `YAML snippet invalid:\n${errors.join("\n")}\n\nSnippet:\n${yamlStr}`);
    }
  }

  const jsonBlocks = [...content.matchAll(/```json\n([\s\S]*?)```/g)];
  for (const block of jsonBlocks) {
    const jsonStr = block[1];
    assert.doesNotThrow(() => JSON.parse(jsonStr), `JSON snippet invalid:\n\nSnippet:\n${jsonStr}`);
  }
});
