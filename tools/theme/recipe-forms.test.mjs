import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { validateConfig } from "./config.mjs";
import { root } from "./build.mjs";

test("Forms recipe config snippets validate", () => {
  const content = readFileSync(join(root, "site/recipes/forms.md"), "utf8");

  const yamlBlocks = [...content.matchAll(/```yaml\n([\s\S]*?)```/g)];
  for (const block of yamlBlocks) {
    const yaml = block[1];
    const config = parse(yaml);
    const { ok, errors } = validateConfig(config);
    assert.equal(ok, true, `YAML snippet invalid:\n${errors.join("\n")}\n\nSnippet:\n${yaml}`);
  }

  const jsonBlocks = [...content.matchAll(/```json\n([\s\S]*?)```/g)];
  for (const block of jsonBlocks) {
    const jsonStr = block[1];
    assert.doesNotThrow(() => JSON.parse(jsonStr), `JSON snippet invalid:\n\nSnippet:\n${jsonStr}`);
  }
});
