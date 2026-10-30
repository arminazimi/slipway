// Builds site/languages.md from _includes/i18n/*.html and _includes/i18n-builtin.html.
// `node tools/theme/languages-page.mjs --write` writes it; `--check` fails when it is stale.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const i18nDir = join(root, "_includes/i18n");
export const builtinPath = join(root, "_includes/i18n-builtin.html");
export const referencePath = join(root, "site/languages.md");

/** The codes written right to left. */
export const rtl = new Set(["ar", "ckb", "dv", "fa", "he", "ps", "sd", "ug", "ur", "yi"]);

/** Each language's name in that language. */
const names = {
  ar: "العربية",
  ckb: "کوردی",
  de: "Deutsch",
  dv: "ދިވެހި",
  en: "English",
  es: "Español",
  fa: "فارسی",
  fr: "Français",
  he: "עברית",
  it: "Italiano",
  ja: "日本語",
  nl: "Nederlands",
  ps: "پښتو",
  pt: "Português",
  ru: "Русский",
  sd: "سنڌي",
  tr: "Türkçe",
  ug: "ئۇيغۇرچە",
  ur: "اردو",
  yi: "ייִדיש",
  zh: "中文",
};

const cell = (text) => String(text).replaceAll("|", "\\|").replaceAll("\n", " ");

/** The `when` keys of one i18n file, in order. */
export function keysOf(block) {
  return [...block.matchAll(/{%-\s*when\s+['"]([^'"]+)['"]\s*-%}/g)].map((match) => match[1]);
}

/** Every `_includes/i18n/<code>.html`, keyed by code. */
export function languageFiles(dir = i18nDir) {
  return new Map(
    readdirSync(dir)
      .filter((file) => file.endsWith(".html"))
      .sort()
      .map((file) => [file.slice(0, -".html".length), keysOf(readFileSync(join(dir, file), "utf8"))]),
  );
}

/** The codes in `sl_supported` in _includes/i18n-builtin.html, in switcher order. */
export function supportedLanguages(block = readFileSync(builtinPath, "utf8")) {
  const match = /assign\s+sl_supported\s*=\s*'([^']*)'\s*\|\s*split\s*:\s*','/.exec(block);
  if (!match) throw new Error("no sl_supported list in _includes/i18n-builtin.html");
  return match[1].split(",").map((code) => code.trim()).filter(Boolean);
}

/** The registry's order, then any file it does not name, so a page is never missing a language. */
export function languageOrder(languages = languageFiles(), supported = supportedLanguages()) {
  const listed = supported.filter((code) => languages.has(code));
  const rest = [...languages.keys()].filter((code) => !listed.includes(code)).sort();
  return [...listed, ...rest];
}

export function buildLanguagesPage(languages = languageFiles(), supported = supportedLanguages()) {
  const english = languages.get("en") ?? [];
  const rows = languageOrder(languages, supported).map((code) => {
    const keys = languages.get(code) ?? [];
    return `| ${cell(names[code] ?? code)} | ${code} | ${rtl.has(code) ? "RTL" : "LTR"} | ${keys.length}/${english.length} | ${supported.includes(code) ? "yes" : "no"} |`;
  });
  return `---
title: Languages
description: Built-in interface languages, their direction, and how complete each translation is.
layout: doc
permalink: /languages/
date: 2026-10-30
author: Slipway
---
<!-- Generated from _includes/i18n/*.html and _includes/i18n-builtin.html by tools/theme/languages-page.mjs. Do not edit below this line. -->

Slipway ships interface strings in ${languages.size} languages. Each translation is one file in \`_includes/i18n/\`, with one {% raw %}\`{%- when 'key' -%}\`{% endraw %} per key in the English \`en.html\`. A translation is complete when it has every key, and a test fails when one is missing or extra. \`_includes/i18n-builtin.html\` names the codes Slipway ships in \`sl_supported\` and falls back to English for any other code.

| Language | Code | Direction | Keys | Built in |
| --- | --- | --- | --- | --- |
${rows.join("\n")}

To add a language, copy \`en.html\`, translate every string in place, and add its code to \`sl_supported\`. Then regenerate this page with \`node tools/theme/languages-page.mjs --write\`.
`;
}

/** Whether site/languages.md matches what the generator builds. */
export function checkLanguagesPage() {
  const expected = buildLanguagesPage();
  let actual = null;
  try {
    actual = readFileSync(referencePath, "utf8");
  } catch {}
  return actual === expected;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    if (!checkLanguagesPage()) {
      console.error(`${referencePath} is stale; run node tools/theme/languages-page.mjs --write`);
      process.exit(1);
    }
  } else {
    writeFileSync(referencePath, buildLanguagesPage());
    console.log(`wrote ${referencePath}`);
  }
}
