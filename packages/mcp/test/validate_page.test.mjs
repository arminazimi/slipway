import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { validatePage } from "../src/tools/validate_page.mjs";

describe("validate_page", () => {
  const tmpDir = join(".tmp", "validate_page_test");

  it("fails when file is missing", async () => {
    await assert.rejects(
      validatePage("examples/docs", { file: "missing.md" }),
      /missing\.md does not exist in the site/
    );
  });

  it("fails when file is outside the site", async () => {
    await assert.rejects(
      validatePage("examples/docs", { file: "../../../package.json" }),
      /is outside the site directory/
    );
  });

  it("validates a good page", async () => {
    rmSync(tmpDir, { recursive: true, force: true });
    mkdirSync(tmpDir, { recursive: true });

    writeFileSync(join(tmpDir, "content-schemas.json"), JSON.stringify({
      version: "0.1",
      schemas: [{
        files: ["index.md", "bad.md"],
        target: "front-matter",
        schema: "schema/page.schema.json"
      }]
    }));
    mkdirSync(join(tmpDir, "schema"), { recursive: true });
    writeFileSync(join(tmpDir, "schema", "page.schema.json"), JSON.stringify({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      required: ["title"],
      properties: {
        title: { type: "string" },
        layout: { enum: ["page"] }
      },
      additionalProperties: false
    }));

    writeFileSync(join(tmpDir, "index.md"), "---\ntitle: Docs\nlayout: page\n---");

    const res = await validatePage(tmpDir, { file: "index.md" });
    assert.deepEqual(res, { errors: [] });
  });

  it("validates a bad page", async () => {
    writeFileSync(join(tmpDir, "bad.md"), "---\ntitle: 123\n---");
    const res = await validatePage(tmpDir, { file: "bad.md" });
    assert.equal(res.errors.length, 1);
    assert.equal(res.errors[0].file, "bad.md");
    assert.equal(res.errors[0].key, "title");
    assert.equal(res.errors[0].message, "must be string");
    assert.deepEqual(res.errors[0].allowed, ["a string"]);
  });
});
