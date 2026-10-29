import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { join } from "node:path";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { scaffoldTranslation } from "../src/tools/scaffold_translation.mjs";

describe("scaffold_translation", () => {
  const tmpDir = join(".tmp", "scaffold_translation_test");

  it("fails when source file is missing", async () => {
    rmSync(tmpDir, { recursive: true, force: true });
    mkdirSync(tmpDir, { recursive: true });

    assert.throws(
      () => scaffoldTranslation(tmpDir, { source: "missing.md", lang: "fa", translation_key: "abc" }),
      /does not exist in the site/
    );
  });

  it("fails when source file is outside the site", async () => {
    assert.throws(
      () => scaffoldTranslation(tmpDir, { source: "../../../package.json", lang: "fa", translation_key: "abc" }),
      /is outside the site directory/
    );
  });

  it("scaffolds a translation", async () => {
    rmSync(tmpDir, { recursive: true, force: true });
    mkdirSync(tmpDir, { recursive: true });

    // config with language prefixes
    writeFileSync(join(tmpDir, "_config.yml"), `
slipway:
  languages:
    - code: en
      prefix: /
    - code: fa
      prefix: /fa/
    - code: de
      prefix: /de/
    `);

    mkdirSync(join(tmpDir, "docs"), { recursive: true });
    writeFileSync(join(tmpDir, "docs", "intro.md"), "---\ntitle: Intro\nlang: en\ntranslation_key: intro\n---\n# Welcome\n\nSee the [about page](/about/) and [other](/other/).");

    // Existing english about page
    writeFileSync(join(tmpDir, "about.md"), "---\ntitle: About\nlang: en\ntranslation_key: about\n---");

    // Existing farsi about page (translated)
    mkdirSync(join(tmpDir, "fa"), { recursive: true });
    writeFileSync(join(tmpDir, "fa", "about.md"), "---\ntitle: About FA\nlang: fa\ntranslation_key: about\n---");

    const result = scaffoldTranslation(tmpDir, { source: "docs/intro.md", lang: "fa", translation_key: "intro" });

    assert.equal(result.status, "created");
    assert.equal(result.file, "fa/docs/intro.md");
    // Link on line 6 was rewritten (assuming offset 5)
    assert.deepEqual(result.lines, [8]);

    const { readFileSync } = await import("node:fs");
    const content = readFileSync(join(tmpDir, "fa/docs/intro.md"), "utf8");
    assert.ok(content.includes("lang: fa"));
    assert.ok(content.includes("translation_key: intro"));
    assert.ok(content.includes("# Welcome"));
    assert.ok(content.includes("[about page](/fa/about/)"));
    assert.ok(content.includes("[other](/other/)")); // Not translated
  });
});
