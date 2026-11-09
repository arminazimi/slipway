import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";

const recipePath = join("site", "recipes", "rel-me.md");

test("rel-me recipe YAML snippets parse", () => {
  const content = readFileSync(recipePath, "utf8");
  const yamlBlocks = content.match(/```yaml\n([\s\S]*?)```/g);
  assert.ok(yamlBlocks && yamlBlocks.length > 0, "Recipe should contain at least one YAML code block");

  for (const block of yamlBlocks) {
    const yamlString = block.replace(/```yaml\n/, "").replace(/```$/, "");
    const parsed = parse(yamlString);
    assert.ok(Array.isArray(parsed) || typeof parsed === "object", "YAML should parse to an array or object");
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        assert.ok(item.network, "Link item should have a 'network' property");
        assert.ok(item.url, "Link item should have a 'url' property");
      }
    }
  }
});
