import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { scaffoldTranslation } from "../src/tools/scaffold_translation.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const fixture = join(root, "fixtures/docs-site");
const tmpDir = join(root, ".tmp/test-scaffold-translation");

/** A copy of fixtures/docs-site with the engine config and the pages this test translates. */
function site() {
  rmSync(tmpDir, { recursive: true, force: true });
  cpSync(fixture, tmpDir, { recursive: true });
  writeFileSync(
    join(tmpDir, "mizzen.yml"),
    [
      "title: Beacon",
      "lang: en",
      "languages:",
      "  - code: en",
      "    name: English",
      '    prefix: ""',
      "  - code: fa",
      "    name: فارسی",
      "    prefix: /fa",
      "",
    ].join("\n"),
  );

  mkdirSync(join(tmpDir, "docs"), { recursive: true });
  writeFileSync(
    join(tmpDir, "docs/intro.md"),
    "---\ntitle: Intro\nlang: en\ntranslation_key: intro\n---\n# Welcome\n\nSee the [about page](/about/) and [other](/other/).\n\nRead the [guide](guide.md).\n",
  );
  writeFileSync(join(tmpDir, "docs/guide.md"), "---\ntitle: Guide\nlang: en\n---\n# Guide\n");
  writeFileSync(join(tmpDir, "about.md"), "---\ntitle: About\nlang: en\ntranslation_key: about\n---");
  mkdirSync(join(tmpDir, "fa"), { recursive: true });
  writeFileSync(join(tmpDir, "fa/about.md"), "---\ntitle: About FA\nlang: fa\ntranslation_key: about\n---");
  return tmpDir;
}

describe("scaffold_translation", () => {
  it("fails when source file is missing", () => {
    const siteDir = site();
    assert.throws(
      () => scaffoldTranslation(siteDir, { source: "missing.md", lang: "fa", translation_key: "abc" }),
      /does not exist in the site/,
    );
  });

  it("fails when source file is outside the site", () => {
    const siteDir = site();
    assert.throws(
      () => scaffoldTranslation(siteDir, { source: "../../../package.json", lang: "fa", translation_key: "abc" }),
      /is outside the site directory/,
    );
  });

  it("fails when the language is not in the engine config", () => {
    const siteDir = site();
    assert.throws(
      () => scaffoldTranslation(siteDir, { source: "docs/intro.md", lang: "de", translation_key: "intro" }),
      /not one of the site's languages/,
    );
  });

  it("creates the page under the language prefix and rewrites links", () => {
    const siteDir = site();
    const result = scaffoldTranslation(siteDir, { source: "docs/intro.md", lang: "fa", translation_key: "intro" });

    assert.equal(result.status, "created");
    assert.equal(result.file, "fa/docs/intro.md");
    assert.equal(result.lang, "fa");
    assert.equal(result.dir, "rtl", "the engine's language rules give Persian a right-to-left direction");
    assert.deepEqual(result.files, ["fa/docs/intro.md"]);
    assert.deepEqual(result.changed.map((entry) => entry.line), [8, 10], "each changed link reports its line in the new file");

    const content = readFileSync(join(siteDir, "fa/docs/intro.md"), "utf8");
    assert.match(content, /lang: fa/);
    assert.match(content, /translation_key: intro/);
    assert.doesNotMatch(content, /^dir:/m, "the source language's direction is not copied");
    assert.match(content, /# Welcome/, "headings stay as placeholders for the translator");
    assert.match(content, /\[about page\]\(\/fa\/about\/\)/, "a link to a translated page names the translation");
    assert.match(content, /\[other\]\(\/other\/\)/, "a link to no page is left alone");
    assert.match(content, /\[guide\]\(\.\.\/\.\.\/docs\/guide\.md\)/, "a relative Markdown link is rebased from the new folder");
  });

  it("refuses to overwrite an existing translation", () => {
    const siteDir = site();
    assert.ok(!existsSync(join(siteDir, "fa/docs/intro.md")));
    scaffoldTranslation(siteDir, { source: "docs/intro.md", lang: "fa", translation_key: "intro" });
    assert.throws(
      () => scaffoldTranslation(siteDir, { source: "docs/intro.md", lang: "fa", translation_key: "intro" }),
      /target file already exists/,
    );
  });
});
