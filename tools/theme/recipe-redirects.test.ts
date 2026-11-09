import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";
import { parse } from "yaml";

const configSchema = JSON.parse(readFileSync(join("packages", "engine", "schema", "config.schema.json"), "utf8"));
const validateConfig = new Ajv2020({ allErrors: true }).compile<any>(configSchema);
const recipePath = join("site", "recipes", "redirects.md");

test("redirects recipe YAML snippets parse and validate", () => {
  const content = readFileSync(recipePath, "utf8");
  const yamlBlocks = content.match(/```yaml\n([\s\S]*?)```/g);
  assert.ok(yamlBlocks && yamlBlocks.length >= 3, "Recipe should contain the config and front matter blocks");

  let sawConfig = false;
  let sawFrom = false;
  let sawTo = false;

  for (const block of yamlBlocks) {
    const yamlString = block.replace(/```yaml\n/, "").replace(/```$/, "");
    const parsed = parse(yamlString);
    assert.ok(typeof parsed === "object" && parsed !== null, "YAML should parse to an object");

    if (parsed.redirects !== undefined) {
      sawConfig = true;
      const ok = validateConfig(parsed);
      const errors = (validateConfig.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
      assert.ok(ok, `Config snippet should validate, got errors: ${errors.join(", ")}`);
      for (const [from, to] of Object.entries(parsed.redirects)) {
        assert.match(from, /^\//, "a redirect key is a path under base");
        assert.match(String(to), /^(\/|https:\/\/)/, "a redirect value is a site path or an https URL");
      }
    } else if (parsed.redirect_from !== undefined) {
      sawFrom = true;
      assert.ok(Array.isArray(parsed.redirect_from), "redirect_from should be an array in this recipe");
      for (const from of parsed.redirect_from) assert.match(from, /^\//, "redirect_from entries start with /");
    } else if (parsed.redirect_to !== undefined) {
      sawTo = true;
      assert.match(parsed.redirect_to, /^(\/|https:\/\/)/, "redirect_to is a site path or an https URL");
    } else {
      assert.fail("YAML block does not look like redirects, redirect_from, or redirect_to");
    }
  }

  assert.ok(sawConfig, "the recipe shows a redirects block");
  assert.ok(sawFrom, "the recipe shows a redirect_from block");
  assert.ok(sawTo, "the recipe shows a redirect_to block");
});
