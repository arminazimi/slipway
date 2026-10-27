import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { validateConfig } from "./config.mjs";
import { root } from "./build.mjs";

test("GitLab Pages recipe config snippets validate", () => {
  const content = readFileSync(join(root, "site/recipes/gitlab-pages.md"), "utf8");

  const yamlBlocks = [...content.matchAll(/```yaml\n([\s\S]*?)```/g)];
  assert.ok(yamlBlocks.length > 0, "has at least one yaml block");

  for (const block of yamlBlocks) {
    const yaml = block[1];
    const config = parse(yaml);
    const { ok, errors } = validateConfig(config);
    assert.equal(ok, true, `YAML snippet invalid:\n${errors.join("\n")}\n\nSnippet:\n${yaml}`);
  }
});
