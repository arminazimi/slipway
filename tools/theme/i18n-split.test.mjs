import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");

test("i18n languages are split into files correctly and integrated in i18n-builtin.html dispatcher", () => {
  const builtin = read("_includes/i18n-builtin.html");
  assert.ok(builtin.includes("{%- assign sl_builtin_lang = include.lang -%}"));
  assert.ok(builtin.includes("{%- assign sl_supported = 'fa,ar,he,es,fr,pt,de,it,ru,tr,nl,ja,zh,en' | split: ',' -%}"));

  const i18nFiles = readdirSync(join(root, "_includes/i18n")).filter(f => f.endsWith(".html"));
  assert.equal(i18nFiles.length, 14, "should have 14 language files");

  for (const file of i18nFiles) {
    const content = read(join("_includes/i18n", file));
    assert.ok(content.includes("{%- case include.key -%}"), `File ${file} should have case statement`);
  }
});
