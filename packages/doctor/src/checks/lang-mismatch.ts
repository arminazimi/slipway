export const id = "doctor.lang-mismatch";
export const level = "warning";

import { startTags } from "../html.ts";
import { blocks } from "../markdown.ts";

const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

const SCRIPTS = [
  "Latn", "Arab", "Cyrl", "Han", "Hebr", "Thaa", "Deva",
  "Beng", "Guru", "Gujr", "Orya", "Taml", "Telu", "Knda",
  "Mlym", "Sinh", "Thai", "Lao", "Mymr", "Khmr", "Geor",
  "Armn", "Ethi", "Grek", "Hang", "Hira", "Kana"
];

function expectedScripts(lang) {
  try {
    const sc = new Intl.Locale(lang).maximize().script;
    if (sc === "Hans" || sc === "Hant") return ["Han"];
    if (sc === "Jpan") return ["Hira", "Kana", "Han"];
    if (sc === "Kore") return ["Hang", "Han"];
    return [sc];
  } catch {
    return ["Latn"];
  }
}

/** The site's language: the engine config's `lang`, then Jekyll's `_config.yml`, else null. */
function siteLanguage(site) {
  const engineLang = site.config()?.data?.lang;
  if (typeof engineLang === "string" && engineLang.trim()) return engineLang.trim();
  for (const name of ["_config.yml", "_config.yaml"]) {
    if (!site.isFile(site.source, name)) continue;
    const lang = site.dataOf(name)?.data?.lang;
    return typeof lang === "string" && lang.trim() ? lang.trim() : null;
  }
  return null;
}

/** The code of the language whose URL prefix the page sits under, from the engine config's `languages`. */
function prefixLanguage(site, file) {
  const segments = file.replace(/\\/g, "/").replace(/^\.?\//, "").split("/").filter(Boolean);
  const languages = site.config()?.data?.languages;
  if (!Array.isArray(languages)) return null;
  for (const language of languages) {
    const parts = typeof language?.prefix === "string" ? language.prefix.split("/").filter(Boolean) : [];
    if (parts.length > 0 && parts.every((part, i) => segments[i] === part) && typeof language.code === "string") return language.code;
  }
  return null;
}

/** The language a built page declares on `<html lang>`, read through the output the manifest names. */
function builtLanguage(site, source, pages) {
  const output = (pages.get(source)?.outputs ?? []).find((file) => typeof file === "string" && /\.html?$/i.test(file));
  if (!output || !site.build || !site.isFile(site.build, output)) return null;
  for (const tag of startTags(site.readOutput(output))) {
    if (tag.name !== "html") continue;
    return tag.attributes.get("lang")?.trim() || null;
  }
  return null;
}

/** The page's language: the built page the manifest names, front matter `lang`, its URL prefix, then the site. */
function pageLanguage(site, file, frontMatter, pages) {
  const declared = frontMatter?.data?.lang;
  return (
    builtLanguage(site, file, pages) ??
    (typeof declared === "string" && declared.trim() ? declared.trim() : null) ??
    prefixLanguage(site, file) ??
    siteLanguage(site)
  );
}

export async function run(site) {
  const pages = new Map(site.pages().map((page) => [page?.source, page]));
  const findings = [];
  const display = new Intl.DisplayNames(["en"], { type: "script" });

  for (const file of site.files()) {
    if (!file.endsWith(".md") && !file.endsWith(".markdown")) continue;

    const fm = site.frontMatterOf(file);
    const lang = pageLanguage(site, file, fm, pages) ?? "en";

    const content = site.read(file);
    if (content === null) continue;

    const proseBlocks = blocks(content).prose;
    const cleanLines = proseBlocks.map(({text}) => {
      return text
        .replace(/`[^`]+`/g, "") // remove inline code
        .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1") // markdown links -> just text
        .replace(/https?:\/\/[^\s]+/g, ""); // bare urls
    });

    const fullCleanText = cleanLines.join("\n");
    const letters = fullCleanText.match(/\p{L}/gu) || [];

    if (letters.length < 200) continue;

    const expScripts = expectedScripts(lang);
    let expectedCount = 0;
    for (const sc of expScripts) {
      expectedCount += (fullCleanText.match(new RegExp(`\\p{sc=${sc}}`, "gu")) || []).length;
    }

    let maxCount = 0;
    let dominantScript = null;
    for (const sc of SCRIPTS) {
      const count = (fullCleanText.match(new RegExp(`\\p{sc=${sc}}`, "gu")) || []).length;
      if (count > maxCount) {
        maxCount = count;
        dominantScript = sc;
      }
    }

    if (dominantScript && !expScripts.includes(dominantScript) && maxCount > expectedCount) {
      const dominantName = display.of(dominantScript) || dominantScript;

      let line = undefined;
      if (fm?.data?.lang) {
         line = fm.lineOf ? fm.lineOf(["lang"]) + fm.offset : undefined;
      }

      findings.push({
        in: "source",
        file,
        line,
        message: `page text script differs from its \`lang\`: dominant script is ${dominantName}`
      });
    }
  }

  return result(findings);
}
