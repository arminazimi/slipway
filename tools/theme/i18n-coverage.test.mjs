import assert from "node:assert/strict";
import { test } from "node:test";
import { buildLanguagesPage, checkLanguagesPage, languageFiles, referencePath, rtl, supportedLanguages } from "./languages-page.mjs";

test("every _includes/i18n language has every key in en.html, in order", () => {
  const languages = languageFiles();
  const english = languages.get("en");
  assert.ok(english?.length, "en.html has keys");
  for (const [lang, keys] of languages) {
    const missing = english.filter((key) => !keys.includes(key));
    const extra = keys.filter((key) => !english.includes(key));
    assert.equal(missing.length, 0, `${lang} is missing ${missing.length} key(s): ${missing.join(", ")}`);
    assert.equal(extra.length, 0, `${lang} has ${extra.length} extra key(s): ${extra.join(", ")}`);
    assert.deepEqual(keys, english, `${lang} keeps the keys in en.html order`);
  }
});

test("site/languages.md lists every language's direction, completeness, and registration", () => {
  assert.ok(checkLanguagesPage(), `${referencePath} is stale; run node tools/theme/languages-page.mjs --write`);
  const page = buildLanguagesPage();
  const supported = supportedLanguages();
  const total = languageFiles().get("en").length;
  for (const [lang, keys] of languageFiles()) {
    const direction = rtl.has(lang) ? "RTL" : "LTR";
    const builtIn = supported.includes(lang) ? "yes" : "no";
    assert.match(page, new RegExp(`\\| [^|]+ \\| ${lang} \\| ${direction} \\| ${keys.length}/${total} \\| ${builtIn} \\|`), lang);
  }
});
