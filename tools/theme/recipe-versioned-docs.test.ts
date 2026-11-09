import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import { parse } from "yaml";

const navSchema = JSON.parse(readFileSync(join("schema", "navigation.schema.json"), "utf8"));
const validateNav = new Ajv2020({ allErrors: true }).compile<any>(navSchema);
const configSchema = JSON.parse(readFileSync(join("packages", "engine", "schema", "config.schema.json"), "utf8"));
const validateConfig = new Ajv2020({ allErrors: true }).compile<any>(configSchema);

test("recipe-versioned-docs code blocks", () => {
  const content = readFileSync(join("site", "recipes", "versioned-docs.md"), "utf8");
  const codeBlocks = [...content.matchAll(/```yaml\n([\s\S]*?)```/g)];
  assert.ok(codeBlocks.length >= 2, "recipe should show the redirect and the navigation");

  let sawConfig = false;
  let sawNav = false;

  for (const block of codeBlocks) {
    const yamlContent = block[1];
    const parsed = parse(yamlContent);

    if (parsed.redirects !== undefined) {
      sawConfig = true;
      const ok = validateConfig(parsed);
      const errors = (validateConfig.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
      assert.ok(ok, `Config validation failed: ${errors.join(", ")}\n${yamlContent}`);
    } else if (parsed.main !== undefined) {
      sawNav = true;
      const ok = validateNav(parsed);
      const errors = (validateNav.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
      assert.ok(ok, `Navigation config validation failed: ${errors.join(", ")}\n${yamlContent}`);
    } else {
      assert.fail(`YAML block is neither a mizzen config nor navigation:\n${yamlContent}`);
    }
  }

  assert.ok(sawConfig, "the recipe shows a redirects block");
  assert.ok(sawNav, "the recipe shows a navigation block");
});
