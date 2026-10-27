import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { validateConfig } from "./config.mjs";

const recipePath = join("site", "recipes", "redirects.md");

test("redirects recipe YAML snippets parse and validate", () => {
  const content = readFileSync(recipePath, "utf8");
  const yamlBlocks = content.match(/```yaml\n([\s\S]*?)```/g);
  assert.ok(yamlBlocks && yamlBlocks.length > 0, "Recipe should contain at least one YAML code block");

  for (const block of yamlBlocks) {
    const yamlString = block.replace(/```yaml\n/, "").replace(/```$/, "");
    const parsed = parse(yamlString);
    assert.ok(Array.isArray(parsed) || typeof parsed === "object", "YAML should parse to an array or object");

    // Distinguish between the config block and the front matter block
    if (parsed.plugins) {
      assert.ok(Array.isArray(parsed.plugins), "plugins should be an array");
      assert.ok(parsed.plugins.includes("jekyll-redirect-from"), "plugins should include jekyll-redirect-from");

      const { ok, errors } = validateConfig(parsed);
      assert.ok(ok, `Config snippet should validate, got errors: ${errors.join(", ")}`);
    } else if (parsed.redirect_from) {
      assert.ok(Array.isArray(parsed.redirect_from), "redirect_from should be an array");
    } else {
      assert.fail("YAML block does not look like plugins or redirect_from");
    }
  }
});
